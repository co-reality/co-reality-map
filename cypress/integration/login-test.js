/* eslint-disable no-undef */
const EMAIL = '';
const PASSWORD = '';

const logIn = () => {
  cy.get(".login-button")
    .click();
  cy.get(".form > .input-group:nth-child(1) > input")
    .type(EMAIL);
  cy.get(".form > .input-group:nth-child(2) > input")
    .type(PASSWORD);
  cy.get('.form > .btn')
    .click();
}

const logOut = () => {
  cy.get('.navbar-link-profile')
    .click();
  cy.get(".popover-body > .profile-modal-container > input:nth-child(7)")
    .click();
}

describe("Test staging.sparkle.space/in/devaliashacksville login, logout, jazzbar and auditorium", function () {

  it("can log in and out", () => {
    cy.visit("https://staging.sparkle.space/in/devaliashacksville");
    cy.clearCookies();

    logIn()
    logOut()
    cy.location('pathname')
      .should('eq', '/v/devaliashacksville');
  });

  it("can visit and interact with the jazzbar", () => {

    // visiting site
    cy.visit("https://staging.sparkle.space/in/devaliashacksville");
    cy.clearCookies();

    // logging in
    logIn()

    // getting into jazzbar

    cy.get(".maproom")
      .contains("jazzbar")
      .parent()
      .parent()
      .click();

    // don't know why but sometimes it requires two clicks? leaving this commented for convenience
    // cy.get(".maproom")
    //   .contains("jazzbar")
    //   .parent()
    //   .parent()
    //   .click();

    cy.get('.room-modal-ongoing-event-container > .room-entry-button')
      .click();
    cy.location('pathname')
      .should('eq', '/in/devaliasjazzbar');

    // interact with video (coming soon)

    // visit tables
    cy.get('.music-bar-content')
      .each(($table) => {
        cy.get('.chat-sidebar__controller')
          .click();

        // enter table room
        cy.wrap($table).get('.table-item > .add-participant-button')
          .first()
          .click();
        cy.get('.modal-container > .btn')
          .click();

        // interact with table and video (coming soon)

        // leave table
        cy.get('.back-button-container > .back-button')
          .click();
    });

    // logging back out
    logOut()

  });

  it("can visit and interact with the auditorium", () => {
    // visiting site
    cy.visit("https://staging.sparkle.space/in/devaliashacksville");
    cy.clearCookies();

    // logging in
    logIn()

    // getting into auditorium
    cy.get(".maproom")
      .contains("auditorium")
      .parent()
      .parent()
      .click();

    // same as for jazzbar button, don't know why it requires me to click on the room button twice for it to work
    cy.get(".maproom")
      .contains("auditorium")
      .parent()
      .parent()
      .click();

    cy.get('.room-modal-ongoing-event-container > .room-entry-button')
      .click();

    cy.location('pathname')
      .should('eq', '/in/devaliasauditorium');

    cy.get('.audience-container > .audience > div:nth-child(2) > div:nth-child(5)')
      .click();

    // interact with auditorium (coming soon)

    cy.get(".leave-seat-button")
      .click();

    // logging out
    logOut()
  });
});
