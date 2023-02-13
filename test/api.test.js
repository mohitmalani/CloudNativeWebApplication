const app = require("../api");
const request = require("supertest");

describe("GET /healthz", () => {
    test("testing...", async() => {
        const response = await request(app).get("/healthz");
        expect(response.body).toEqual("server responds with 200 OK if it is healhty.");
        expect(response.statusCode).toBe(200);
    });
});