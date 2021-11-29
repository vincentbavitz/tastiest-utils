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

  test('Restaurant Emails', async () => {
    const horus = new Horus();

    const result = await horus.Restaurant.Email.schedule({
      token: 'vincent@bavitz.org',
      restaurantId: 'zFekbQT8LNaQb5enmzKw5iLe46P2',
      templateId: '1635506a-357d-426e-a8e5-efd3f3b2494e',
      subject: 'subject33',
      scheduleFor: Date.now() + 5000,
    });

    dlog('horus.test ➡️ result:', result);
  });
});
