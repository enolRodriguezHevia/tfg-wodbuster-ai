/// <reference types="cypress" />

describe('Entrenamientos E2E', () => {
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

  it('flujo completo: login, registrar y borrar entrenamiento', () => {
    // Ir a Login desde la página raíz
    cy.contains('Ir a Login').click();
    cy.url().should('include', '/login');

    // Login
    cy.get('input[name="username"]').type('e2etestuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');

    // Ir a Entrenamientos
    cy.get('.navbar-link-btn').contains('Entrenamientos').click();
    cy.url().should('include', '/entrenamientos');

    // Abrir formulario
    cy.get('button.btn-nuevo-entrenamiento').click();
    cy.get('form.entrenamiento-form').should('be.visible');

    // Rellenar datos del primer ejercicio
    cy.get('select').first().select('Squat');
    cy.get('input').eq(1).clear().type('3'); // series
    cy.get('input').eq(2).clear().type('5'); // repeticiones
    cy.get('input').eq(3).clear().type('100'); // peso
    cy.get('input').eq(4).clear().type('8'); // valoración

    // Guardar entrenamiento
    cy.get('button.btn-submit').click();

    // Verificar mensaje de éxito
    cy.contains('Entrenamiento registrado con éxito').should('be.visible');

    // Verificar que aparece en el historial
    cy.get('.entrenamientos-list').should('be.visible');
    cy.get('.entrenamiento-card').within(() => {
      // Verificar que existe una fecha (sin hardcodear la fecha específica)
      cy.get('.card-titulo').should('exist');
      cy.get('.stat-text').should('contain', '1 ejercicios');
      cy.get('.ejercicio-tag').should('contain', 'Squat');
    });

    // Borrar el entrenamiento
    cy.get('.entrenamiento-card').first().find('button.btn-delete-card').click();
    cy.get('.btn-modal-action.btn-eliminar').should('be.visible').click();

    // Verificar que desaparece
    cy.get('.entrenamiento-card').should('not.exist');
  });
});
