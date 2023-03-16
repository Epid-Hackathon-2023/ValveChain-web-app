const fs = require('fs');
const { writeFileSync } = require('fs');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const path = require('path');
const crypto = require('crypto');

const addedHashes = new Set();

/**
 * Crée un nouveau document PDF rempli avec des données de formulaire pour chaque vanne dans un fichier JSON
 * @param {string} templatePath - Le chemin d'accès au fichier PDF de modèle existant
 * @param {string} dataPath - Le chemin d'accès au fichier JSON de données de formulaire
 * @param {string} outputPath - Le chemin d'accès au dossier où les fichiers PDF remplis seront enregistrés
 * @param {string} inputPath - Le chemin d'accès au dossier où les fichiers PDF remplis seront enregistrés
 */

async function createPdfForms(dataPath, inputPath, outputPath) {
  //const templateBytes = fs.readFileSync(templatePath);
  const jsonData = JSON.parse(fs.readFileSync(dataPath));
  const currentDate = new Date().toLocaleDateString("fr-FR");

  for (const annexeData of jsonData) {
    const numeroTranche = annexeData.tranche;
    const niveauAnnexe = annexeData.annexes;
    const localisationAnnexe = annexeData.localisation_groupe
    const descriptionAnnexe = annexeData.annexe_description
    const vannesAnnexe = annexeData.vannes;
    const nomTechnicien = annexeData.nomTechnicien;


    //let pdfDoc = await PDFDocument.load(templateBytes);
    let pdfDoc = await PDFDocument.create();
    const helveticaFont = pdfDoc.getForm().getDefaultFont(); // obtenir la police par défaut
    const form = pdfDoc.getForm();
    let page = pdfDoc.addPage();
    //let page = pdfDoc.getPages()[0];

    const positions = {
      O: 'Ouvert',
      F: 'Fermé',
      SO: 'Semi-Ouvert',
      SF: 'Semi-Fermé'
    };
    
    const drawText = (text, x, y, size) => {
      const textWidth = helveticaFont.widthOfTextAtSize(text, size);
      if (y < 50) { // si la position Y actuelle est trop basse
        page = pdfDoc.addPage(); // passer à la page suivante
        y = page.getHeight() - 50; // réinitialiser la position Y
      }
      page.drawText(text, { x: x - textWidth / 2, y: y - size / 2, size: size, font: helveticaFont });
    };

    drawText(`Tranche : ${numeroTranche}`, 300, 800, 15);
    drawText(`Annexe : ${niveauAnnexe} / ${descriptionAnnexe}`, 300, 750, 20);
    drawText(`Localisation : ${localisationAnnexe}`, 300, 720, 15);

    let y = 700;
    for (const vanneData of vannesAnnexe) {
      const id = vanneData.id;
      const repereFonctionnel = vanneData.repereFonctionnel;
      const positionConstatee = vanneData.positionConstatee;
      const positionAttendue = vanneData.positionAttendue;
      const temperatureAttendue = vanneData.temperatureAttendue
      const temperatureAmont = vanneData.temperatureAmont;
      const temperatureAval = vanneData.temperatureAval;
      const temperatureMoyenne = (temperatureAmont + temperatureAval) / 2;
      const descriptionvanne = vanneData.description;

      const comment = (temperatureMoyenne < temperatureAttendue - 5 || temperatureMoyenne > temperatureAttendue + 5)
        ? 'Température anormale'
        : (positionConstatee !== positionAttendue)
          ? 'Position anormale'
          : 'OK';

      if (y < 100) { // si la position Y actuelle est trop basse
        page = pdfDoc.addPage(); // passer à la page suivante
        y = page.getHeight() - 50; // réinitialiser la position Y
      }
        
          page.drawLine({
            start: { x: 50, y: y  },
            end: { x: page.getWidth() - 50, y: y },
            thickness: 1,
          });         
          
      y -= 20;
      //drawText(`Vanne ID: ${id}`, 300, y, 15);
      drawText(`Nom de la vanne: ${repereFonctionnel}`, 300, y, 15);
      y -= 30;
      drawText(`Position constatée: ${positions[positionConstatee]}`, 200, y, 10);
      drawText(`Position attendue: ${positions[positionAttendue]}`, 400, y, 10);
      y -= 20;
      drawText(`Température constatée amont: ${temperatureAmont}`, 140, y, 10);
      drawText(`Température constatée aval: ${temperatureAval}`, 310, y, 10);
      drawText(`Température attendue: ${temperatureAttendue}`,460, y, 10);
      y -=20;
      drawText(`Commentaire: ${comment}`, 300, y, 10);
      y -=20;
      drawText(`Description: ${descriptionvanne}`, 300, y, 10);
      drawText(`Technicien: ${nomTechnicien}`, 100, 800, 10);
      drawText(`Date: ${currentDate}`, page.getWidth() - 100, 800, 10, { align: 'right' });

      y -= 20;
 } 
    const numPages = pdfDoc.getPages().length;

    for (let i = 0; i < numPages; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();
      const fontSize = 12;
      const pageText = `Page ${i + 1} sur ${numPages} [${niveauAnnexe}]`;
    
      page.drawText(pageText, {
        x: width - fontSize * pageText.length / 2 - 10,
        y: height - fontSize - 10,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      });
    }
    const pdfBytes = await pdfDoc.save();
    writeFileSync(`${inputPath}/Annexe_${niveauAnnexe}.pdf`, pdfBytes);
  

    async function mergePDFs() {
      const pdfDoc = await PDFDocument.create();
    
      const files = fs.readdirSync(inputPath);
      for (const file of files) {
        if (file.endsWith('.pdf')) {
          const bytes = fs.readFileSync(path.join(inputPath, file));
          const hash = crypto.createHash('sha256').update(bytes).digest('hex'); // calculer le hachage SHA256 du contenu du fichier
          if (!addedHashes.has(hash)) { // Vérifiez si l'empreinte numérique a déjà été ajoutée
            const doc = await PDFDocument.load(bytes);
            const pages = await pdfDoc.copyPages(doc, doc.getPageIndices());
            pages.forEach((page) => pdfDoc.addPage(page));
            addedHashes.add(hash); // Ajoutez l'empreinte numérique à l'ensemble des empreintes numériques des fichiers ajoutés
          }
        }
      }
    
      const mergedPdfBytes = await pdfDoc.save();
      fs.writeFileSync(`${outputPath}/tournee.pdf`, mergedPdfBytes);
    }

    mergePDFs();
    
  }
}

createPdfForms('testdoss/data.json', 'testdoss/annexe', 'testdoss/tournee');