/// <reference types="cypress" />

describe('WODs CrossFit E2E', () => {
  before(() => {
    // Crear usuario de prueba si no existe
    cy.visit('/');
    cy.contains('Ir a Sign Up').click();
    cy.url().should('include', '/signup');
    
    cy.get('input[name="username"]').type('e2etestuser');
    cy.get('input[name="email"]').type('e2etestuser@example.com');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();
    
    // Si el usuario ya existe, ignorar el error y continuar
    cy.url().then((url) => {
      if (url.includes('/dashboard')) {
        // Usuario creado exitosamente, hacer logout
        cy.contains('Logout').click();
      } else if (url.includes('/signup')) {
        // Usuario ya existe, volver a home
        cy.visit('/');
      }
    });
  });

  beforeEach(() => {
    cy.visit('/');
  });

  it('flujo completo: login, registrar y borrar WOD', () => {
    // Ir a Login desde la página raíz
    cy.contains('Ir a Login').click();
    cy.url().should('include', '/login');

    // Login
    cy.get('input[name="username"]').type('e2etestuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');

    // Ir a WODs CrossFit
    cy.get('.navbar-link-btn').contains('WODs CrossFit').click();
    cy.url().should('include', '/wods-crossfit');

    // Abrir formulario
    cy.get('button.btn-nuevo-wod').click();
    cy.get('form.wod-form').should('be.visible');

    // Seleccionar WOD y nivel
    cy.get('select').first().select('Fran');
    cy.get('input[type="radio"][value="rx"]').check();

    // Rellenar fecha y tiempo (usar fecha actual)
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    cy.get('input[type="date"]').clear().type(today);
    cy.get('input').filter('[placeholder="0"]').first().clear().type('5'); // minutos
    cy.get('input').filter('[placeholder="0"]').last().clear().type('30'); // segundos

    // Guardar WOD
    cy.get('button.btn-submit').click();

    // Verificar mensaje de éxito
    cy.contains('WOD registrado con éxito').should('be.visible');

    // Verificar que aparece en la lista
    cy.get('.wod-item').should('contain', 'Fran');
    cy.get('.nivel-badge').should('contain', 'RX');
    cy.get('.tiempo-valor').should('contain', '5:30');
    cy.get('.wod-fecha').should('exist'); // Verificar que existe fecha sin hardcodear

    // Borrar el WOD
    cy.get('.wod-item').first().find('button.btn-delete').click();
    cy.get('.btn-modal-action.btn-eliminar').should('be.visible').click();

    // Verificar que desaparece
    cy.get('.wod-item').should('not.exist');
  });
});
