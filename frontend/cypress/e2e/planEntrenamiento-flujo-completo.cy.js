/// <reference types="cypress" />

describe('PlanEntrenamiento E2E', () => {
  before(() => {
    // Crear usuario de prueba si no existe
    cy.visit('/');
    cy.contains('Ir a Sign Up').click();
    cy.url().should('include', '/signup');
    
    cy.get('input[name="username"]').type('e2etestuserPlanes');
    cy.get('input[name="email"]').type('e2etestuserPlanes@example.com');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('select[name="sex"]').select('masculino');
    cy.get('input[name="age"]').type('28');
    cy.get('input[name="weight"]').type('75');
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

  it('flujo completo: login, registrar entrenamiento y generar plan', () => {
    // Ir a Login desde la página raíz
    cy.contains('Ir a Login').click();
    cy.url().should('include', '/login');

    // --- Login ---
    cy.get('input[name="username"]').type('e2etestuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();

    // Esperar redirección
    cy.url().should('not.include', '/login');

    // --- Registrar un entrenamiento primero para tener datos históricos ---
    cy.contains('Entrenamientos').click();
    cy.url().should('include', '/entrenamientos');

    // Abrir formulario de entrenamiento
    cy.get('button.btn-nuevo-entrenamiento').click();
    cy.get('form.entrenamiento-form').should('be.visible');

    // Rellenar datos del primer ejercicio
    cy.get('select').first().select('Squat');
    cy.get('input').eq(1).clear().type('4'); // series
    cy.get('input').eq(2).clear().type('8'); // repeticiones
    cy.get('input').eq(3).clear().type('80'); // peso
    cy.get('input').eq(4).clear().type('7'); // valoración

    // Guardar entrenamiento
    cy.get('button.btn-submit').click();

    // Verificar mensaje de éxito
    cy.contains('Entrenamiento registrado con éxito').should('be.visible');

    // --- Ir a Plan de Entrenamiento ---
    cy.contains('Plan de Entrenamiento').click();
    cy.url().should('include', '/plan-entrenamiento');

    // --- Completar el nombre del plan (opcional) ---
    cy.get('input#nombrePlan').type('Semana 1 - Fuerza');

    // --- Generar plan ---
    cy.get('button.btn-generar').click();

    // --- Verificar que aparece la tarjeta de plan generado (timeout aumentado para IA) ---
    cy.get('.plan-generado-card', { timeout: 60000 }).should('exist');
    cy.contains('✅ Plan de Entrenamiento Generado').should('exist');

    // --- Abrir modal de plan completo ---
    cy.get('button.btn-ver-plan').click();
    cy.get('.modal-overlay').should('exist');

    // --- Cerrar modal antes de interactuar con la tarjeta ---
    cy.get('button.btn-close-modal').click();
    cy.get('.modal-overlay').should('not.exist');

    // --- Copiar plan desde la tarjeta ---
    cy.get('button.btn-action').contains('📋').click();

    // --- Descargar plan desde la tarjeta ---
    cy.get('button.btn-action').contains('💾').click();

    // --- Borrar plan generado ---
    cy.get('button.btn-eliminar').contains('🗑️').click();
    cy.get('.plan-generado-card').should('not.exist');

    // --- Opcional: verificar planes anteriores si existieran ---
    cy.get('h2').contains('📚 Planes Anteriores').should('exist');

    // --- Limpiar: borrar el entrenamiento registrado ---
    cy.contains('Entrenamientos').click();
    cy.url().should('include', '/entrenamientos');
    
    // Borrar el entrenamiento si existe
    cy.get('body').then($body => {
      if ($body.find('.entrenamiento-card').length > 0) {
        cy.get('.entrenamiento-card').first().find('button.btn-delete-card').click();
        cy.get('.btn-modal-action.btn-eliminar').should('be.visible').click();
      }
    });
  });
});
