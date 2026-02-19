/// <reference types="cypress" />

describe('AnalisisVideos E2E', () => {
  beforeEach(() => {
    // Asume que la app corre en localhost:3001 (ajusta si es necesario)
    cy.visit('http://localhost:3001/login');
  });

  it('flujo completo: login, navegar y analizar video', () => {
    // Login
    cy.get('input[name="username"]').type('e2etestuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();

    // Esperar redirección al dashboard o home
    cy.url().should('not.include', '/login');

    // Ir a Análisis de Videos (ajusta el selector si es un link o botón diferente)
    cy.contains('Análisis de Videos').click();
    cy.url().should('include', '/analisis-videos');

    // Seleccionar ejercicio
    cy.get('select[aria-label="Ejercicio"]').select('sentadilla');
    // Subir video de ejemplo
    cy.fixture('BuenaSentadillaPerfil.mp4', 'base64').then(video => {
      const blob = Cypress.Blob.base64StringToBlob(video, 'video/mp4');
      const file = new File([blob], 'BuenaSentadillaPerfil.mp4', { type: 'video/mp4' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      cy.get('input[type="file"]').then(input => {
        input[0].files = dataTransfer.files;
        cy.wrap(input).trigger('change', { force: true });
      });
    });
    // Analizar
    cy.get('button[type="submit"]').click();
    // Esperar feedback
    cy.contains('feedback', { matchCase: false, timeout: 20000 }).should('exist');
  });
});
