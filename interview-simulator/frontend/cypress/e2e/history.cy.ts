describe('Interview History', () => {
  const mockHistory = [
    {
      id: 'hist-1',
      date: new Date().toISOString(),
      config: {
        role: 'Frontend Developer',
        type: 'technical',
        difficulty: 'mid',
        language: 'en',
        totalQuestions: 5,
      },
      report: {
        overallScore: 85,
        strengths: ['Technical knowledge'],
        improvements: ['More examples'],
        questionScores: [
          { question: 'Q1', answer: 'A1', score: 8, feedback: 'Good' },
        ],
        suggestedResources: ['Resource 1'],
      },
    },
    {
      id: 'hist-2',
      date: new Date(Date.now() - 86400000).toISOString(),
      config: {
        role: 'Backend Developer',
        type: 'behavioral',
        difficulty: 'senior',
        language: 'en',
        totalQuestions: 8,
      },
      report: {
        overallScore: 72,
        strengths: ['Communication'],
        improvements: ['Specificity'],
        questionScores: [
          { question: 'Q1', answer: 'A1', score: 7, feedback: 'OK' },
        ],
        suggestedResources: ['Resource 2'],
      },
    },
  ];

  beforeEach(() => {
    // Seed localStorage with mock history
    cy.window().then((win) => {
      win.localStorage.setItem('intervia-history', JSON.stringify(mockHistory));
    });
    cy.visit('/history');
  });

  it('should display past interviews', () => {
    cy.contains('Frontend Developer').should('be.visible');
    cy.contains('Backend Developer').should('be.visible');
  });

  it('should show scores on interview cards', () => {
    cy.contains('85').should('be.visible');
    cy.contains('72').should('be.visible');
  });

  it('should delete an interview', () => {
    // Hover to reveal delete button, then click
    cy.contains('Frontend Developer')
      .closest('[class*="card"], [class*="interview"], li, article, div')
      .trigger('mouseenter')
      .find('button')
      .filter(':visible')
      .first()
      .click();

    cy.contains('Frontend Developer').should('not.exist');
  });

  it('should show empty state when no history', () => {
    cy.window().then((win) => {
      win.localStorage.removeItem('intervia-history');
    });
    cy.visit('/history');
    cy.contains(/no.*interview|start.*first/i).should('be.visible');
  });

  it('should clear all history', () => {
    // Click "Clear All" twice (confirmation pattern)
    cy.get('button')
      .filter(':visible')
      .contains(/clear/i)
      .click();
    cy.get('button')
      .filter(':visible')
      .contains(/confirm|clear/i)
      .click();

    cy.contains(/no.*interview|start.*first/i).should('be.visible');
  });
});
