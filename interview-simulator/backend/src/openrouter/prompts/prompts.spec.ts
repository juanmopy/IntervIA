import { buildInterviewerSystemPrompt } from './prompt-builder';
import { INTERVIEWER_BASE_PROMPT } from './interviewer-system.prompt';
import { EVALUATOR_SYSTEM_PROMPT } from './evaluator-system.prompt';
import { getPersonaPrompt } from './persona-variants.prompt';

describe('Interviewer Prompts', () => {
  describe('INTERVIEWER_BASE_PROMPT', () => {
    it('should contain the JSON schema definition', () => {
      expect(INTERVIEWER_BASE_PROMPT).toContain('"messages"');
      expect(INTERVIEWER_BASE_PROMPT).toContain('"metadata"');
      expect(INTERVIEWER_BASE_PROMPT).toContain('"facialExpression"');
      expect(INTERVIEWER_BASE_PROMPT).toContain('"animation"');
      expect(INTERVIEWER_BASE_PROMPT).toContain('"phase"');
    });

    it('should mention the interviewer persona name', () => {
      expect(INTERVIEWER_BASE_PROMPT).toContain('Alex');
    });

    it('should define the interview flow phases', () => {
      expect(INTERVIEWER_BASE_PROMPT).toContain('Greeting');
      expect(INTERVIEWER_BASE_PROMPT).toContain('Warmup');
      expect(INTERVIEWER_BASE_PROMPT).toContain('Closing');
    });
  });

  describe('EVALUATOR_SYSTEM_PROMPT', () => {
    it('should contain evaluation schema fields', () => {
      expect(EVALUATOR_SYSTEM_PROMPT).toContain('"overallScore"');
      expect(EVALUATOR_SYSTEM_PROMPT).toContain('"strengths"');
      expect(EVALUATOR_SYSTEM_PROMPT).toContain('"improvements"');
      expect(EVALUATOR_SYSTEM_PROMPT).toContain('"questionScores"');
      expect(EVALUATOR_SYSTEM_PROMPT).toContain('"suggestedResources"');
    });
  });

  describe('getPersonaPrompt()', () => {
    it('should return friendly persona', () => {
      const prompt = getPersonaPrompt('friendly');
      expect(prompt).toContain('Friendly');
      expect(prompt).toContain('warm');
    });

    it('should return strict persona', () => {
      const prompt = getPersonaPrompt('strict');
      expect(prompt).toContain('Strict');
      expect(prompt).toContain('formal');
    });

    it('should return casual persona', () => {
      const prompt = getPersonaPrompt('casual');
      expect(prompt).toContain('Casual');
      expect(prompt).toContain('relaxed');
    });
  });

  describe('buildInterviewerSystemPrompt()', () => {
    it('should include base prompt', () => {
      const result = buildInterviewerSystemPrompt({
        role: 'Software Engineer',
        difficulty: 'mid',
      });
      expect(result).toContain('You are Alex');
    });

    it('should include role and difficulty context', () => {
      const result = buildInterviewerSystemPrompt({
        role: 'Frontend Developer',
        difficulty: 'senior',
      });
      expect(result).toContain('Frontend Developer');
      expect(result).toContain('senior');
      expect(result).toContain('architecture');
    });

    it('should include persona variant', () => {
      const result = buildInterviewerSystemPrompt({
        role: 'DevOps Engineer',
        difficulty: 'junior',
        persona: 'strict',
      });
      expect(result).toContain('Strict');
      expect(result).toContain('formal');
    });

    it('should include resume context when provided', () => {
      const result = buildInterviewerSystemPrompt({
        role: 'Backend Dev',
        difficulty: 'mid',
        resumeContext: '5 years experience with Node.js and Python',
      });
      expect(result).toContain('Candidate Resume');
      expect(result).toContain('5 years experience');
    });

    it('should include job description when provided', () => {
      const result = buildInterviewerSystemPrompt({
        role: 'Data Scientist',
        difficulty: 'senior',
        jobDescription: 'Looking for ML expertise with TensorFlow',
      });
      expect(result).toContain('Job Description');
      expect(result).toContain('TensorFlow');
    });

    it('should set language correctly', () => {
      const result = buildInterviewerSystemPrompt({
        role: 'QA Engineer',
        difficulty: 'junior',
        language: 'Spanish',
      });
      expect(result).toContain('Spanish');
    });

    it('should default to 8 questions and English', () => {
      const result = buildInterviewerSystemPrompt({
        role: 'Developer',
        difficulty: 'mid',
      });
      expect(result).toContain('8');
      expect(result).toContain('English');
    });
  });
});
