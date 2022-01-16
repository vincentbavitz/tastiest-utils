import { dlog } from '../..';
import { Horus } from '../../services/horus';

describe('Test Horus', () => {
  // Remove window object in order to NodeFetch
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //   const { window } = global;

  beforeAll(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    delete global.window;
  });

  test('Restaurant Support Get', async () => {
    const token = `eyJhbGciOiJSUzI1NiIsImtpZCI6IjQwMTU0NmJkMWRhMzA0ZDc2NGNmZWUzYTJhZTVjZDBlNGY2ZjgyN2IiLCJ0eXAiOiJKV1QifQ.eyJyZXN0YXVyYW50Ijp0cnVlLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdGFzdGllc3QtZGlzaGVzIiwiYXVkIjoidGFzdGllc3QtZGlzaGVzIiwiYXV0aF90aW1lIjoxNjQyMjY4MjI2LCJ1c2VyX2lkIjoidUNwWWtvdkNGUlU4OGtxWFhtVng5eWxtbm04MyIsInN1YiI6InVDcFlrb3ZDRlJVODhrcVhYbVZ4OXlsbW5tODMiLCJpYXQiOjE2NDIyNzQ0MjYsImV4cCI6MTY0MjI3ODAyNiwiZW1haWwiOiJkZXZlbG9wZXJzQHRhc3RpZXN0LmlvIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImRldmVsb3BlcnNAdGFzdGllc3QuaW8iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.e_Ft6LkIXQsHNHm_xLDNSqzTMXyygJm2M3vUzzNIY6aNELqouwJJgadlH6Ckgnijyd1pDFtkMJQcy1ro0FbgtOtm90vsnIW9FOlX4hFr6Z17VedwWNHpbV-5nUrO0p5CEWphHKqIzai8N77fMJB6NSlu997ofzttrwr1JdJOrEFVErIpoidqFUXiquwesFQsZsdFBjY65VHKCT_gwo19AxWqxlgq0t3mzvWon0It3Jdi-q82pmSqXwGL43BfNi6P4ZzrrnuWSOX-z1GqK12KISNGWhcQOcfEYXk91PToGsi3ivKEeLuYpX1eb5qMHYIblC9ey5bYxJ1TTYSrTO0Qvg`;
    const horus = new Horus(token);

    const result = await horus.get(
      `/support/restaurants/ticket/95285be1-0beb-47ea-849d-41437c4afb2c`,
      { key: 14, bob: 'the-builder' },
    );

    dlog('horus.test ➡️ result:', result);

    expect(result.error).toBeNull();
  });

  test('Restaurant Support Reply', async () => {
    const token = `eyJhbGciOiJSUzI1NiIsImtpZCI6IjQwMTU0NmJkMWRhMzA0ZDc2NGNmZWUzYTJhZTVjZDBlNGY2ZjgyN2IiLCJ0eXAiOiJKV1QifQ.eyJyZXN0YXVyYW50Ijp0cnVlLCJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vdGFzdGllc3QtZGlzaGVzIiwiYXVkIjoidGFzdGllc3QtZGlzaGVzIiwiYXV0aF90aW1lIjoxNjQyMjY4MjI2LCJ1c2VyX2lkIjoidUNwWWtvdkNGUlU4OGtxWFhtVng5eWxtbm04MyIsInN1YiI6InVDcFlrb3ZDRlJVODhrcVhYbVZ4OXlsbW5tODMiLCJpYXQiOjE2NDIyNzQ0MjYsImV4cCI6MTY0MjI3ODAyNiwiZW1haWwiOiJkZXZlbG9wZXJzQHRhc3RpZXN0LmlvIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImRldmVsb3BlcnNAdGFzdGllc3QuaW8iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.e_Ft6LkIXQsHNHm_xLDNSqzTMXyygJm2M3vUzzNIY6aNELqouwJJgadlH6Ckgnijyd1pDFtkMJQcy1ro0FbgtOtm90vsnIW9FOlX4hFr6Z17VedwWNHpbV-5nUrO0p5CEWphHKqIzai8N77fMJB6NSlu997ofzttrwr1JdJOrEFVErIpoidqFUXiquwesFQsZsdFBjY65VHKCT_gwo19AxWqxlgq0t3mzvWon0It3Jdi-q82pmSqXwGL43BfNi6P4ZzrrnuWSOX-z1GqK12KISNGWhcQOcfEYXk91PToGsi3ivKEeLuYpX1eb5qMHYIblC9ey5bYxJ1TTYSrTO0Qvg`;
    const horus = new Horus(token);

    const result = await horus.post('/support/restaurants/reply', {
      id: '95285be1-0beb-47ea-849d-41437c4afb2c',
      name: 'Numaaan33',
      message: 'Posting a reply again',
    });

    expect(result.error).toBeNull();
  });
});
