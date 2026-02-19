/// <reference types="cypress" />

// Custom commands can be added here
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Intercept the interview start API call with mock data
       */
      mockInterviewStart(): Chainable<void>;

      /**
       * Intercept the interview message API call with mock data
       */
      mockInterviewMessage(overrides?: Record<string, unknown>): Chainable<void>;

      /**
       * Intercept the interview end API call with mock report
       */
      mockInterviewEnd(): Chainable<void>;
    }
  }
}

const mockStartResponse = {
  sessionId: 'test-session-123',
  message: {
    messages: [
      {
        text: "Hello! I'm Alex, and I'll be your interviewer today. Let's get started!",
        facialExpression: 'smile',
        animation: 'Talking',
        emotion: 'friendly',
      },
    ],
    metadata: {
      questionNumber: 1,
      totalQuestions: 5,
      phase: 'introduction',
      scoreHint: null,
    },
  },
  audio: null,
  lipsync: null,
};

const mockMessageResponse = {
  message: {
    messages: [
      {
        text: "That's a great answer! Now, can you tell me about a challenging project?",
        facialExpression: 'thoughtful',
        animation: 'Talking',
        emotion: 'interested',
      },
    ],
    metadata: {
      questionNumber: 2,
      totalQuestions: 5,
      phase: 'technical',
      scoreHint: 7,
    },
  },
  audio: null,
  lipsync: null,
};

const mockReport = {
  overallScore: 78,
  strengths: ['Strong technical knowledge', 'Clear communication'],
  improvements: ['Could provide more examples', 'Time management'],
  questionScores: [
    {
      question: 'Tell me about yourself',
      answer: 'I am a software developer...',
      score: 8,
      feedback: 'Good introduction with relevant experience highlighted.',
    },
    {
      question: 'Describe a challenging project',
      answer: 'I led a migration project...',
      score: 7,
      feedback: 'Good example but could be more specific on outcomes.',
    },
  ],
  suggestedResources: ['System Design Primer', 'STAR Method Guide'],
};

Cypress.Commands.add('mockInterviewStart', () => {
  cy.intercept('POST', '**/api/interview/start', {
    statusCode: 201,
    body: mockStartResponse,
  }).as('startInterview');
});

Cypress.Commands.add('mockInterviewMessage', (overrides = {}) => {
  cy.intercept('POST', '**/api/interview/message', {
    statusCode: 201,
    body: { ...mockMessageResponse, ...overrides },
  }).as('sendMessage');
});

Cypress.Commands.add('mockInterviewEnd', () => {
  cy.intercept('POST', '**/api/interview/end', {
    statusCode: 201,
    body: { report: mockReport },
  }).as('endInterview');
});

export {};
