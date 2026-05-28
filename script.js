// Sample Property Data
const properties = [
    {
        id: 1,
        name: "Modern Downtown Penthouse",
        price: 2500000,
        location: "Downtown",
        address: "456 Sky Tower, Downtown City",
        bedrooms: 4,
        bathrooms: 3,
        sqft: 3500,
        description: "Stunning penthouse with panoramic city views and luxury finishes",
        badge: "Featured",
        image: "🏢"
    },
    {
        id: 2,
        name: "Beachfront Villa",
        price: 1800000,
        location: "Coastal Area",
        address: "789 Beach Street, Coastal City",
        bedrooms: 3,
        bathrooms: 2,
        sqft: 2800,
        description: "Gorgeous beach house with private access to pristine sandy beaches",
        badge: "Hot",
        image: "🏖️"
    },
    {
        id: 3,
        name: "Suburban Family Home",
        price: 750000,
        location: "Suburbs",
        address: "123 Green Lane, Suburb City",
        bedrooms: 4,
        bathrooms: 2.5,
        sqft: 2200,
        description: "Perfect family home in quiet neighborhood with great schools",
        badge: "New",
        image: "🏡"
    },
    {
        id: 4,
        name: "Luxury Mountain Retreat",
        price: 3200000,
        location: "Mountain Area",
        address: "999 Peak Road, Mountain City",
        bedrooms: 5,
        bathrooms: 4,
        sqft: 4000,
        description: "Exclusive mountain estate with breathtaking views and privacy",
        badge: "Luxury",
        image: "⛰️"
    },
    {
        id: 5,
        name: "Historic Downtown Loft",
        price: 950000,
        location: "Downtown",
        address: "321 Heritage Ave, Downtown City",
        bedrooms: 2,
        bathrooms: 2,
        sqft: 1800,
        description: "Charming converted loft with original architectural details",
        badge: "Featured",
        image: "🏬"
    },
    {
        id: 6,
        name: "Gated Community Mansion",
        price: 4500000,
        location: "Exclusive Area",
        address: "888 Prestige Drive, Exclusive City",
        bedrooms: 6,
        bathrooms: 5,
        sqft: 5500,
        description: "Ultimate luxury mansion in prestigious gated community",
        badge: "Elite",
        image: "👑"
    },
    {
        id: 7,
        name: "Cozy Urban Apartment",
        price: 550000,
        location: "Downtown",
        address: "555 Urban Street, Downtown City",
        bedrooms: 1,
        bathrooms: 1,
        sqft: 900,
        description: "Trendy downtown apartment perfect for young professionals",
        badge: "New",
        image: "🏢"
    },
    {
        id: 8,
        name: "Lakefront Manor",
        price: 2100000,
        location: "Lake Area",
        address: "777 Lakeside Road, Lake City",
        bedrooms: 4,
        bathrooms: 3,
        sqft: 3200,
        description: "Elegant home with direct lake access and boat dock",
        badge: "Hot",
        image: "🏔️"
    }
];

// Sample Agent Data
const agents = [
    { name: "Sarah Mitchell", title: "Senior Agent", email: "sarah@luxeproperty.com", sales: "500+", emoji: "👩‍💼" },
    { name: "Michael Chen", title: "Luxury Specialist", email: "michael@luxeproperty.com", sales: "450+", emoji: "👨‍💼" },
    { name: "Jessica Rodriguez", title: "Investment Expert", email: "jessica@luxeproperty.com", sales: "380+", emoji: "👩‍💼" }
];

// Sample Testimonials
const testimonials = [
    { author: "John Smith", rating: 5, text: "LuxeProperty found me the perfect home! Their agents were professional and attentive." },
    { author: "Emma Davis", rating: 5, text: "Outstanding service from start to finish. Highly recommend to anyone looking to buy or sell!" },
    { author: "Robert Wilson", rating: 5, text: "Best real estate experience ever. They handled everything with expertise and care." }
];

// Render Featured Properties
function renderFeaturedProperties() {
    const featured = properties.slice(0, 3);
    const grid = document.getElementById('featuredGrid');
    grid.innerHTML = featured.map(prop => createPropertyCard(prop)).join('');
}

// Render All Properties
function renderAllProperties(propsToRender = properties) {
    const grid = document.getElementById('listingsGrid');
    grid.innerHTML = propsToRender.length > 0
        ? propsToRender.map(prop => createPropertyCard(prop)).join('')
        : '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #999;">No properties found matching your criteria</div>';
}

// Create Property Card HTML
function createPropertyCard(prop) {
    return `
        <div class="property-card">
            <div class="property-image">
                <span style="font-size: 5rem;">${prop.image}</span>
                <span class="property-badge">${prop.badge}</span>
            </div>
            <div class="property-info">
                <div class="property-price">$${prop.price.toLocaleString()}</div>
                <div class="property-address">${prop.address}</div>
                <div class="property-details">
                    <div class="detail-item">
                        <div class="detail-label">Beds</div>
                        <div class="detail-value">${prop.bedrooms}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Baths</div>
                        <div class="detail-value">${prop.bathrooms}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">SqFt</div>
                        <div class="detail-value">${(prop.sqft / 1000).toFixed(1)}K</div>
                    </div>
                </div>
                <div class="property-description">${prop.description}</div>
                <button onclick="contactAboutProperty('${prop.name}')" style="width: 100%; padding: 0.8rem; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.3s;">
                    Schedule Viewing
                </button>
            </div>
        </div>
    `;
}

// Render Agents
function renderAgents() {
    const grid = document.getElementById('agentsGrid');
    grid.innerHTML = agents.map(agent => `
        <div class="agent-card">
            <div class="agent-image">${agent.emoji}</div>
            <div class="agent-info">
                <div class="agent-name">${agent.name}</div>
                <div class="agent-title">${agent.title}</div>
                <p>Sales: ${agent.sales}</p>
                <div class="agent-contact">
                    <a href="mailto:${agent.email}">Email</a>
                    <a href="tel:+15551234567">Call</a>
                </div>
            </div>
        </div>
    `).join('');
}

// Render Testimonials
function renderTestimonials() {
    const grid = document.getElementById('testimonialGrid');
    grid.innerHTML = testimonials.map(test => `
        <div class="testimonial-card">
            <div class="stars">${'⭐'.repeat(test.rating)}</div>
            <div class="testimonial-text">"${test.text}"</div>
            <div class="testimonial-author">- ${test.author}</div>
        </div>
    `).join('');
}

// Filter Properties
function applyFilters() {
    const location = document.getElementById('filterLocation').value.toLowerCase();
    const minPrice = parseFloat(document.getElementById('filterMinPrice').value) || 0;
    const maxPrice = parseFloat(document.getElementById('filterMaxPrice').value) || Infinity;
    const bedrooms = parseFloat(document.getElementById('filterBedrooms').value) || 0;

    const filtered = properties.filter(prop => {
        return (prop.location.toLowerCase().includes(location)) &&
               (prop.price >= minPrice) &&
               (prop.price <= maxPrice) &&
               (prop.bedrooms >= bedrooms);
    });

    renderAllProperties(filtered);
}

// Search from Hero
function performSearch() {
    const location = document.getElementById('locationSearch').value.toLowerCase();
    const price = document.getElementById('priceFilter').value;
    const bedrooms = document.getElementById('bedroomFilter').value;

    let filtered = properties;

    if (location) {
        filtered = filtered.filter(p => p.location.toLowerCase().includes(location));
    }

    if (price) {
        const [min, max] = price.split('-').map(Number);
        filtered = filtered.filter(p => p.price >= min && p.price <= max);
    }

    if (bedrooms) {
        filtered = filtered.filter(p => p.bedrooms >= parseInt(bedrooms));
    }

    renderAllProperties(filtered);
    scrollToSection('listings');
}

// Scroll to Section
function scrollToSection(id) {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
}

// Contact Form Handler
function handleContactSubmit(e) {
    e.preventDefault();
    alert('Thank you for your inquiry! We will contact you shortly.');
    e.target.reset();
}

// Contact About Property
function contactAboutProperty(propertyName) {
    alert(`You're interested in: ${propertyName}\nOur agent will contact you soon!`);
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    renderFeaturedProperties();
    renderAllProperties();
    renderAgents();
    renderTestimonials();
});
