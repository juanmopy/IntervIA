describe('Interview Flow', () => {
  beforeEach(() => {
    cy.mockInterviewStart();
    cy.mockInterviewMessage();
    cy.mockInterviewEnd();

    // Navigate to interview by starting from config
    cy.visit('/');
    cy.get('input[formControlName="role"]').type('Software Engineer');
    cy.get('input[value="technical"]').check({ force: true });
    cy.get('input[value="mid"]').check({ force: true });
    cy.get('button[type="submit"]').click();
    cy.wait('@startInterview');
  });

  it('should display the interview view', () => {
    cy.url().should('include', '/interview/session');
  });

  it('should show the interviewer greeting', () => {
    cy.contains("Hello! I'm Alex").should('be.visible');
  });

  it('should allow sending a text message', () => {
    cy.get('textarea, input[type="text"]')
      .filter(':visible')
      .first()
      .type('I have 5 years of experience in web development');
    cy.get('button')
      .filter(':visible')
      .contains(/send/i)
      .click();
    cy.wait('@sendMessage');
    cy.contains('challenging project').should('be.visible');
  });

  it('should show progress indicator', () => {
    cy.contains(/question/i).should('be.visible');
  });

  it('should handle end interview', () => {
    // Click end interview button
    cy.get('button')
      .filter(':visible')
      .contains(/end/i)
      .click();

    cy.wait('@endInterview');
    cy.url().should('include', '/report');
  });
});
