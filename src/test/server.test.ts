import * as request from "superagent";
import * as chai from "chai";
const expect = chai.expect;

// Load NodeJS app
// set environement to test
process.env.ENV = "test";
process.env.SESSION_SECRET = "ThisIsTheTestSecret";
process.env.SECURITY_TOKEN = "ThisIsTheSecurityToken";
const myApp = require("../server");
const baseUrl = "http://localhost:8080/";

describe("GET /ping/id", () => {
  it("should return 200 Pong", (done) => {
    request.get(baseUrl + "ping/1234567890").send().end(function assert(err, res) {
      expect(err).to.be.equal(null);
      expect(res).to.have.property("status", 200);
      done();
    });
  });
});

describe("GET /pinger", () => {
  it("should return 401", (done) => {
    request.get(baseUrl + "ping").send().end(function assert(err, res) {
      expect(err).not.to.be.equal(null);
      expect(err.status).to.be.equal(401);
      done();
    });
  });
});

describe("GET /deaddrop/1234567890", () => {
  it("should return 401", (done) => {
    request.get(baseUrl + "deaddrop/1234567890").send().end(function assert(err, res) {
      expect(err).not.to.be.equal(null);
      expect(err.status).to.be.equal(401);
      done();
    });
  });
});

describe("GET /deaddrop/group/group1?id=1234567890", () => {
  it("should return 401", (done) => {
    request.get(baseUrl + "deaddrop/group/group1").send().end(function assert(err, res) {
      expect(err).not.to.be.equal(null);
      expect(err.status).to.be.equal(401);
      done();
    });
  });
});

describe("GET /deaddrop/all/version1?id=1234567890", () => {
  it("should return 401", (done) => {
    request.get(baseUrl + "deaddrop/all/version1?id=1234567890").send().end(function assert(err, res) {
      expect(err).not.to.be.equal(null);
      expect(err.status).to.be.equal(401);
      done();
    });
  });
});

// must create file first
describe("GET /ping/1234567890 and /deaddrop/1234567890", () => {

  it("should return 200", (done) => {
    request.post(baseUrl + "slack?token=ThisIsTheSecurityToken&user_name=gabriel&text=1234567890+1").send()
      .end(function assert(err, res) {
        expect(err).to.be.equal(null);
        expect(res.status).to.be.equal(200);

        const agent = request.agent();
        agent.get(baseUrl + "ping/1234567890").send().end(function assert(err, res) {
          expect(err).to.be.equal(null);
          expect(res).to.have.property("status", 200);
          agent.get(baseUrl + "deaddrop/1234567890").send().end(function assert(err, res) {
            expect(err).to.be.equal(null);
            expect(res.status).to.be.equal(200);
            expect(res.text).to.be.equal("1");
            done();
          });
        });

      });
  });

});

describe("GET /ping/1234567890 and /deaddrop/group/group1?id=1234567890", () => {
  it("should return 200", (done) => {
    const agent = request.agent();
    agent.get(baseUrl + "ping/1234567890").send().end(function assert(err, res) {
      expect(err).to.be.equal(null);
      expect(res).to.have.property("status", 200);
      agent.get(baseUrl + "deaddrop/group/group1?id=1234567890").send().end(function assert(err, res) {
        expect(err).to.be.equal(null);
        expect(res.status).to.be.equal(200);
        done();
      });
    });
  });
});

describe("GET /ping/1234567890 and /deaddrop/all/version1?id=1234567890", () => {
  it("should return 200", (done) => {
    const agent = request.agent();
    agent.get(baseUrl + "ping/1234567890").send().end(function assert(err, res) {
      expect(err).to.be.equal(null);
      expect(res).to.have.property("status", 200);
      agent.get(baseUrl + "deaddrop/all/version1?id=1234567890").send().end(function assert(err, res) {
        expect(err).to.be.equal(null);
        expect(res.status).to.be.equal(200);
        done();
      });
    });
  });
});