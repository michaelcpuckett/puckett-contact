"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const react_1 = __importDefault(require("react"));
const express_1 = __importDefault(require("express"));
const activitypub_core_express_middleware_1 = require("activitypub-core-express-middleware");
const LoginPage_1 = require("./LoginPage");
const DashboardPage_1 = require("./DashboardPage");
const activitypub_core_jsx_components_1 = require("activitypub-core-jsx-components");
const server_1 = require("react-dom/server");
const activitypub_core_mongodb_1 = require("activitypub-core-mongodb");
const activitypub_core_firebase_authentication_1 = require("activitypub-core-firebase-authentication");
const activitypub_core_delivery_1 = require("activitypub-core-delivery");
const envServiceAccount = process.env.AP_SERVICE_ACCOUNT;
if (!envServiceAccount) {
    throw new Error('Bad Service Account.');
}
const serviceAccount = JSON.parse(decodeURIComponent(envServiceAccount));
(async () => {
    const app = (0, express_1.default)();
    app.use(express_1.default.static('static/'));
    const authenticationService = new activitypub_core_firebase_authentication_1.FirebaseAuthentication(serviceAccount, 'pickpuck-com');
    const databaseService = await new activitypub_core_mongodb_1.MongoDatabaseService().connect({
        mongoClientUrl: process.env.AP_MONGO_CLIENT_URL ?? 'mongodb://localhost:27017',
        dbName: 'michaelpuckett-engineer',
    });
    const deliveryService = new activitypub_core_delivery_1.DeliveryService(databaseService);
    app.use((0, activitypub_core_express_middleware_1.activityPub)({
        renderIndex: async () => {
            return `
        <!doctype html>
        ${(0, server_1.renderToString)(react_1.default.createElement(LoginPage_1.LoginPage, null))}`;
        },
        renderEntity: async ({ entity, actor }) => {
            return `
        <!doctype html>
        ${(0, server_1.renderToString)(react_1.default.createElement(activitypub_core_jsx_components_1.EntityPage, { entity: entity, actor: actor }))}
      `;
        },
        renderHome: async ({ actor }) => {
            return `
        <!doctype html>
        ${(0, server_1.renderToString)(react_1.default.createElement(DashboardPage_1.DashboardPage, { actor: actor }))}
      `;
        },
    }, {
        authenticationService,
        databaseService,
        deliveryService,
    }));
    app.listen(process.env.PORT ?? 3000, () => {
        console.log('Running...');
    });
})();
//# sourceMappingURL=index.js.map