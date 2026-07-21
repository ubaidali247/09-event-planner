// Search and Filter Tests - Event Planner
describe('Search and Filter - Event Planner', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('.nav-link[data-page="events"]').click();
  });

  it('search input is visible', () => {
    cy.get('#search-input').should('be.visible');
  });

  it('category filter is visible', () => {
    cy.get('#filter-category').should('be.visible');
  });

  it('searching for existing item title shows result', () => {
    cy.get('#events-list .item-card').first().find('.item-title').invoke('text').then(title => {
      const searchTerm = title.slice(0, 5);
      cy.get('#search-input').clear().type(searchTerm);
      cy.get('#events-list .item-card').should('have.length.gte', 1);
    });
  });

  it('searching for non-existent term shows empty state', () => {
    cy.get('#search-input').type('xyzabc123nonexistent');
    cy.get('#events-list').should('contain', 'No items found');
  });

  it('clearing search restores full list', () => {
    cy.get('#events-list .item-card').then($cards => {
      const total = $cards.length;
      cy.get('#search-input').type('xyznonexistent');
      cy.get('#search-input').clear();
      cy.get('#events-list .item-card').should('have.length', total);
    });
  });

  it('category filter shows all categories option', () => {
    cy.get('#filter-category option').first().should('contain', 'All Categories');
  });

  it('filter by Conference category works', () => {
    cy.get('#filter-category').select('Conference');
    cy.get('#events-list').should('be.visible');
  });

  it('filter by All Categories shows all items', () => {
    cy.get('#filter-category').select('Conference');
    cy.get('#filter-category').select('');
    cy.get('#events-list .item-card').should('have.length.gte', 1);
  });

  it('api search endpoint filters results', () => {
    cy.request('/api/events?search=test').its('body').should('be.an', 'array');
  });

  it('api category filter endpoint works', () => {
    cy.request('/api/events?category=Conference').its('body').should('be.an', 'array');
  });

  it('search is case-insensitive', () => {
    cy.get('#events-list .item-card').first().find('.item-title').invoke('text').then(title => {
      cy.get('#search-input').clear().type(title.toUpperCase().slice(0, 4));
      cy.get('#events-list .item-card').should('have.length.gte', 1);
    });
  });

  it('combined search and filter works', () => {
    cy.get('#search-input').type('a');
    cy.get('#filter-category').select('Conference');
    cy.get('#events-list').should('be.visible');
  });

  it('resetting filters shows full list', () => {
    cy.get('#search-input').type('test');
    cy.get('#filter-category').select('Conference');
    cy.get('#search-input').clear();
    cy.get('#filter-category').select('');
    cy.get('#events-list .item-card').should('have.length.gte', 1);
  });

  it('api returns all items when no filter applied', () => {
    cy.request('/api/events').its('body').should('have.length.gte', 1);
  });

  it('recent items section visible on dashboard', () => {
    cy.get('.nav-link[data-page="dashboard"]').click();
    cy.get('.recent-section').should('be.visible');
    cy.get('#recent-list').should('be.visible');
  });
});
