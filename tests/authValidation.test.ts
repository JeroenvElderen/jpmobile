import assert from "node:assert/strict";
import test from "node:test";
import { extractInvite, filterOtp, isEmailIdentifier, isRegistrationLink, isValidPhone, normalizePhone, validateCommon } from "../src/lib/authValidation";
import { ADMIN_EMAIL, isAdminEmail, isAdminUser } from "../src/lib/authRouting";
import { getFunctionErrorMessage } from "../src/lib/functionErrors";

test("detects email identifiers", () => { assert.equal(isEmailIdentifier("person@example.com"), true); assert.equal(isEmailIdentifier("+31612345678"), false); });
test("preserves case-insensitive admin routing", () => {
  assert.equal(ADMIN_EMAIL, "jeroen@jeroenandpaws.com");
  assert.equal(isAdminEmail(" JEROEN@JEROENANDPAWS.COM "), true);
  assert.equal(isAdminUser({ email: "jeroen@jeroenandpaws.com" }), true);
  assert.equal(isAdminUser({ email: "client@example.com" }), false);
});
test("normalizes formatted international phones", () => { assert.equal(normalizePhone(" +31 (6) 123-45.678 "), "+31612345678"); assert.equal(isValidPhone("+31 6 12345678"), true); });
test("validates registration and password confirmation", () => { assert.match(validateCommon({ inviteCode:"short",fullName:"J",password:"password",confirmPassword:"password" })!,/Invite/); assert.match(validateCommon({ inviteCode:"12345678",fullName:"J",password:"password",confirmPassword:"different" })!,/match/); assert.equal(validateCommon({ inviteCode:"12345678",fullName:"Jeroen",password:"password",confirmPassword:"password" }),null); });
test("filters and validates OTP input", () => { assert.equal(filterOtp("1a2 34-567"),"123456"); assert.equal(filterOtp("123").length===6,false); });
test("extracts invite deep links safely", () => {
  assert.equal(extractInvite("jeroenandpaws://register?invite=PAWS%202026"), "PAWS 2026");
  assert.equal(extractInvite("https://jeroenandpaws.com/register?invite=PAWS%202026"), "PAWS 2026");
  assert.equal(extractInvite("https://www.jeroenandpaws.com/register?source=email&invite=PAWS2026"), "PAWS2026");
  assert.equal(extractInvite("jeroenandpaws://register"), null);
  assert.equal(isRegistrationLink("https://jeroenandpaws.com/register/?invite=PAWS2026"), true);
});
test("extracts a useful Edge Function error response", async () => {
  const response = new Response(JSON.stringify({ error: "Push token table is unavailable." }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
  const error = Object.assign(new Error("Edge Function returned a non-2xx status code"), { context: response });
  assert.equal(await getFunctionErrorMessage(error, "Request failed."), "Push token table is unavailable.");
});