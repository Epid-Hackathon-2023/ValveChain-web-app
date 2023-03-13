const fs = require('fs');
const { writeFileSync } = require('fs');
const { PDFDocument, StandardFonts } = require('pdf-lib');

/**
 * Crée un nouveau document PDF rempli avec des données de formulaire pour chaque vanne dans un fichier JSON
 * @param {string} templatePath - Le chemin d'accès au fichier PDF de modèle existant
 * @param {string} dataPath - Le chemin d'accès au fichier JSON de données de formulaire
 * @param {string} outputPath - Le chemin d'accès au dossier où les fichiers PDF remplis seront enregistrés
 * @param {number} temperatureAttendue - La température attendue pour chaque vanne
 * @param {string[]} _positionsPossibles - Les différentes positions possibles pour la vanne
 */

async function createPdfForms(templatePath, dataPath, outputPath, temperatureAttendue, _positionsPossibles) {
  const templateBytes = fs.readFileSync(templatePath);
  const jsonData = JSON.parse(fs.readFileSync(dataPath));
  const currentDate = new Date().toLocaleDateString("fr-FR");

  for (const annexeData of jsonData) {
    const niveauAnnexe = annexeData.niveau;
    const vannesAnnexe = annexeData.vannes;
    const nomTechnicien = annexeData.nomTechnicien;

    const pdfDoc = await PDFDocument.load(templateBytes);
    const helveticaFont = pdfDoc.getForm().getDefaultFont(); // obtenir la police par défaut
    const form = pdfDoc.getForm();
    const page = pdfDoc.getPages()[0];

    const drawText = (text, x, y, size) => {
      const textWidth = helveticaFont.widthOfTextAtSize(text, size);
      page.drawText(text, { x: x - textWidth / 2, y: y - size / 2, size: size, font: helveticaFont });
    };

    drawText(`Niveau d'annexe: ${niveauAnnexe}`, 300, 750, 20);

    let y = 700;
    for (const vanneData of vannesAnnexe) {
      const id = vanneData.id;
      const repereFonctionnel = vanneData.repereFonctionnel;
      const positionConstatee = vanneData.positionConstatee;
      const temperatureAmont = vanneData.temperatureAmont;
      const temperatureAval = vanneData.temperatureAval;
      const temperatureMoyenne = (temperatureAmont + temperatureAval) / 2;

      const comment = (temperatureMoyenne < temperatureAttendue - 5 || temperatureMoyenne > temperatureAttendue + 5)
        ? 'Température anormale'
        : (!_positionsPossibles.includes(positionConstatee))
          ? 'Position anormale'
          : 'OK';

      drawText(`Vanne ID: ${id}`, 300, y, 15);
      y -= 20;
      drawText(`Repère fonctionnel: ${repereFonctionnel}`, 100, y, 10);
      drawText(`Position constatée: ${positionConstatee}`, 300, y, 10);
      drawText(`Température constatée en amont: ${temperatureAmont}`, 500, y, 10);
      y -= 20;
      drawText(`Température constatée en aval: ${temperatureAval}`, 100, y, 10);
      drawText(`Température attendue: ${temperatureAttendue}`,300, y, 10);
      drawText(`Commentaire: ${comment}`, 500, y, 10);
      drawText(`Technicien: ${nomTechnicien}`, 100, 800, 10);
      drawText(`Date: ${currentDate}`, page.getWidth() - 100, 800, 10, { align: 'right' });

      y -= 50;
    }

    const pdfBytes = await pdfDoc.save();
    writeFileSync(`${outputPath}/Annexe_${niveauAnnexe}.pdf`, pdfBytes);
  }
}

createPdfForms('testdoss/template.pdf', 'testdoss/data.json', 'testdoss', 30, ['O','F','SO','SF']);