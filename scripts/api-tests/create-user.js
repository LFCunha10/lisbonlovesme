"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"])(value); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
var bcrypt_1 = require("bcryptjs");
var db_1 = require("../../server/db");
var schema_1 = require("../../shared/schema");
function createUser() {
    return __awaiter(this, void 0, void 0, function () {
        var username, password, hashed;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    username = "newadmin";
                    password = "securepass123";
                    return [4 /*yield*/, bcrypt_1.default.hash(password, 10)];
                case 1:
                    hashed = _a.sent();
                    return [4 /*yield*/, db_1.db.insert(schema_1.users).values({
                            username: username,
                            password: hashed,
                            isAdmin: true,
                        }).execute()];
                case 2:
                    _a.sent();
                    console.log("User created.");
                    return [2 /*return*/];
            }
        });
    });
}
createUser();

