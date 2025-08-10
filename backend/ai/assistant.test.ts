import request from 'supertest';
import { Service } from 'encore.dev/service';
import api from './assistant';

describe('AI Assistant Service', () => {
  
  it('should respond with a message', async () => {
    const res = await request(Service).post('/ai/message').send({
      message: 'How does quantum physics relate to consciousness?'
    });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('response');
  });

  it('should handle invalid requests gracefully', async () => {
    const res = await request(Service).post('/ai/message').send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

});
