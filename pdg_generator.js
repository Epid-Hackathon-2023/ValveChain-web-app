const fs = require('fs');
const { PDFDocument, StandardFonts } = require('pdf-lib');

/**
 * Remplit un formulaire PDF existant avec des données provenant d'un fichier JSON
 * @param {string} templatePath - Le chemin d'accès au fichier PDF de modèle existant
 * @param {string} outputPath - Le chemin d'accès au fichier PDF rempli à enregistrer
 * @param {object} jsonData - Les données à insérer dans le formulaire PDF sous forme d'objet JSON
 */
async function fillPdfForm(templatePath, outputPath, jsonData) {
  // Charger le document PDF existant depuis le serveur NFS
  const templateBytes = fs.readFileSync(templatePath);

  // Créer un nouveau document PDF basé sur le document existant
  const pdfDoc = await PDFDocument.load(templateBytes);

  // Ajouter les données du formulaire aux champs de formulaire du document PDF
  const form = pdfDoc.getForm();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const valveYPosition = jsonData.id;
  
  // Remplir le champ "Position Constatée" avec les données du fichier JSON
  const positionConstateeField = form.createTextField('positionConstatee')
  positionConstateeField.setText(jsonData.positionConstatee);
  positionConstateeField.addToPage(page, { x: 451.2003, y: 464.92, size: 10 })

  // Remplir le champ "Température relevée en Amont" avec les données du fichier JSON
  const temperatureAmontField = form.createTextField('temperatureAmont');
  temperatureAmontField.setText(jsonData.temperatureAmont);
  positionConstateeField.addToPage(page, { x: 667.2004, y: 464.92, size: 10 })

  // Remplir le champ "Température relevée en Aval" avec les données du fichier JSON
  const temperatureAvalField = form.getTextField('Température relevée en Aval');
  temperatureAvalField.setText(jsonData.temperatureAval);

  // Enregistrer le document PDF avec les champs de formulaire remplis
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
}

// Exemple d'utilisation de la fonction fillPdfForm pour remplir un formulaire PDF existant avec des données provenant d'un fichier JSON
const jsonData = JSON.parse(fs.readFileSync('/testdoss/data.json'));
fillPdfForm('/testdoss/template.pdf', '/testdoss/filledForm.pdf', jsonData);