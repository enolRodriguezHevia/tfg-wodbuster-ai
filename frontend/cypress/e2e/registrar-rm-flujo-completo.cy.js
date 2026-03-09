/// <reference types="cypress" />

describe('Benchmarks (1RM) E2E', () => {
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

  it('flujo completo: login, registrar y borrar 1RM', () => {
    // Ir a Login desde la página raíz
    cy.contains('Ir a Login').click();
    cy.url().should('include', '/login');

    // Login
    cy.get('input[name="username"]').type('e2etestuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();

    // Esperar redirección al dashboard
    cy.url().should('not.include', '/login');

    // Ir a Benchmarks
    cy.get('.navbar-link-btn').contains('Benchmarks').click();
    cy.url().should('include', '/benchmarks');

    // Seleccionar ejercicio (usar el botón de la tarjeta)
    cy.get('.exercise-card').contains('Snatch').click();
    cy.url().should('include', '/benchmarks');

    // Registrar nuevo 1RM (usar fecha actual)
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    cy.get('input[name="peso"]').type('120');
    cy.get('input[name="fecha"]').clear().type(today);
    cy.get('form.onerm-form').submit();

    // Verificar mensaje de éxito
    cy.contains('1RM registrado con éxito').should('be.visible');

    // Verificar que aparece en el historial
    cy.get('table').should('be.visible');
    cy.get('table tbody tr').should('contain', '120');

    // Borrar la marca registrada
    cy.get('table tbody tr').contains('120').parent().scrollIntoView().within(() => {
      cy.get('button.btn-delete-small').click({ force: true });
    });
    // Confirmar en el modal
    cy.get('button.btn-modal-action.btn-eliminar').should('be.visible').click();

    // Verificar que desaparece el registro (puede mostrar mensaje de "no hay registros" si era el único)
    cy.get('body').should(($body) => {
      const hasTable = $body.find('table tbody tr').length > 0;
      const hasNoDataMessage = $body.text().includes('Aún no hay registros');
      
      if (hasTable) {
        expect($body.find('table tbody tr').text()).not.to.contain('120');
      } else {
        expect(hasNoDataMessage).to.be.true;
      }
    });
  });
});
