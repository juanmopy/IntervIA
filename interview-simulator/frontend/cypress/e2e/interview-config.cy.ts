describe('Interview Configuration', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('should display the home page with hero section', () => {
    cy.get('app-navbar').should('exist');
    cy.contains('IntervIA').should('be.visible');
    cy.contains('Practice Job Interviews').should('be.visible');
  });

  it('should show the interview config form', () => {
    cy.get('input[formControlName="role"]').should('exist');
    cy.get('input[formControlName="totalQuestions"]').should('exist');
  });

  it('should require a job role to submit', () => {
    cy.get('button[type="submit"]').click();
    cy.get('input[formControlName="role"]').should('have.class', 'ng-invalid');
  });

  it('should fill the form and start an interview', () => {
    cy.mockInterviewStart();

    cy.get('input[formControlName="role"]').type('Frontend Developer');

    // Select interview type
    cy.get('input[value="technical"]').check({ force: true });

    // Select difficulty
    cy.get('input[value="mid"]').check({ force: true });

    // Adjust question slider
    cy.get('input[formControlName="totalQuestions"]').invoke('val', 5).trigger('input');

    // Submit the form
    cy.get('button[type="submit"]').click();

    cy.wait('@startInterview');
    cy.url().should('include', '/interview/session');
  });

  it('should allow adding optional job description', () => {
    cy.get('textarea[formControlName="jobDescription"]').type(
      'We are looking for a skilled developer'
    );
    cy.get('textarea[formControlName="jobDescription"]').should(
      'have.value',
      'We are looking for a skilled developer'
    );
  });
});
