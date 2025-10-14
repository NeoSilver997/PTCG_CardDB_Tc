import '@testing-library/jest-dom';

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
  })
);

class Request {
    constructor(input, init) {
        this.body = init.body;
    }

    json() {
        return JSON.parse(this.body);
    }
}

class Response {
    constructor(body, init) {
        this.body = body;
        this.status = init ? init.status : 200;
    }

    json() {
        return this.body;
    }
}

global.Request = Request;
global.Response = Response;