import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const responseTime = new Trend('response_time');
const errorRate = new Rate('error_rate');

export const options = {
  stages: [
    { duration: '15s', target: 10 }, // ramp up to 10 VUs
    { duration: '30s', target: 10 }, // hold at 10 VUs
    { duration: '15s', target: 0  }, // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000'],  // 95% of requests under 3s
    http_req_failed:   ['rate<0.05'],   // error rate below 5%
    error_rate:        ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL;

export default function () {
  const res = http.get(BASE_URL, {
    tags: { page: 'home' },
    timeout: '10s',
  });

  const ok = check(res, {
    'status is 200':        (r) => r.status === 200,
    'response time < 3s':   (r) => r.timings.duration < 3000,
    'body not empty':       (r) => r.body && r.body.length > 0,
  });

  responseTime.add(res.timings.duration);
  errorRate.add(!ok);

  sleep(1);
}
