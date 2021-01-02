describe("CreateEntry:", function () {
  //   Step 1: setup the application state
  beforeEach(function () {
    cy.visit("/");
  });

  describe("Menu Bar:", () => {
    it("allows a user to create a note", () => {
      // Step 2: Take an action (Sign in)
      cy.get("[data-test=noteNameInput]").type("DUMMY_NOTE_NAME");
      cy.get("[data-test=noteDescriptionInput]").type("DUMMY_NOTE_DESCRIPTION");
      cy.get("[data-test=createNoteButton]").click();

      // Step 3: Make an assertion (Check for sign-out text)
      // cy.get(selectors.signOutButton).contains("Sign Out");
    });
  });
});
