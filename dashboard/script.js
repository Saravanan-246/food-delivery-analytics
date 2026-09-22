// State Management
const state = {
    raw: { orders: [], customers: [], validation: [] },
    filtered: { orders: [] },
    filters: { date: 'all', city: 'all', cuisine: 'all', restaurant: 'all', segment: 'all', status: 'all', payment: 'all' },
    colors: ['#55B8FF', '#A78BFA', '#55D695', '#F5B84B', '#FF6B78', '#14b8a6', '#f43f5e']
};

document.addEventListener('DOMContentLoaded', async () => {
    initNavigation();
    initTooltip();
    try {
        await loadData();
        processDerivedData();
        populateFilterDropdowns();
        setupFilterListeners();
        applyFiltersAndRender();
        document.getElementById('app-loading').classList.remove('active');
        
        // Handle window resize dynamically for SVG charts
        window.addEventListener('resize', debounce(() => renderAllPages(), 200));
    } catch (err) {
        console.error(err);
        document.getElementById('loading-msg').style.display = 'none';
        document.getElementById('app-error').classList.add('active');
        document.getElementById('error-msg').innerText = err.message;
    }
});

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout); timeout = setTimeout(later, wait);
    };
}

async function loadData() {
    const orderRes = await fetch('/data/processed/cleaned_food_delivery.csv');
    if (!orderRes.ok) throw new Error('Could not load cleaned_food_delivery.csv');
    state.raw.orders = parseCSV(await orderRes.text());
    try {
        const custRes = await fetch('/outputs/customer_analysis.csv');
        if (custRes.ok) state.raw.customers = parseCSV(await custRes.text());
    } catch(e) {}
    try {
        const valRes = await fetch('/outputs/validation/validation_results.csv');
        if (valRes.ok) state.raw.validation = parseCSV(await valRes.text());
    } catch(e) {}
}

function parseCSV(text) {
    if(!text || !text.trim()) return [];
    const lines = text.trim().split(/\r?\n/);
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(','); 
        const obj = {};
        headers.forEach((h, i) => {
            let val = values[i] !== undefined ? values[i].trim() : '';
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            obj[h] = isNaN(val) || val === '' ? val : Number(val);
        });
        return obj;
    });
}

function processDerivedData() {
    const customerSpend = {};
    state.raw.orders.forEach(o => { customerSpend[o.customer_id] = (customerSpend[o.customer_id] || 0) + (Number(o.order_amount) || 0); });
    state.raw.orders.forEach(o => {
        const total = customerSpend[o.customer_id];
        o.derived_segment = total > 3000 ? 'High Value' : (total > 1000 ? 'Regular' : 'Occasional');
    });
}

function populateFilterDropdowns() {
    const unique = (key) => [...new Set(state.raw.orders.map(o => o[key]))].filter(Boolean).sort();
    fillDropdown('filter-date', unique('month_name'));
    fillDropdown('filter-city', unique('city'));
    fillDropdown('filter-cuisine', unique('cuisine'));
    fillDropdown('filter-restaurant', unique('restaurant_name'));
    fillDropdown('filter-segment', unique('derived_segment'));
    fillDropdown('filter-status', unique('order_status'));
    fillDropdown('filter-payment', unique('payment_method'));
}

function fillDropdown(id, values) {
    const select = document.getElementById(id);
    values.forEach(v => {
        const opt = document.createElement('option'); opt.value = v; opt.textContent = v; select.appendChild(opt);
    });
}

function setupFilterListeners() {
    const filters = ['date', 'city', 'cuisine', 'restaurant', 'segment', 'status', 'payment'];
    filters.forEach(f => {
        document.getElementById(`filter-${f}`).addEventListener('change', (e) => {
            state.filters[f] = e.target.value; applyFiltersAndRender();
        });
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
        filters.forEach(f => { state.filters[f] = 'all'; document.getElementById(`filter-${f}`).value = 'all'; });
        applyFiltersAndRender();
    });
    document.getElementById('search-order').addEventListener('input', (e) => renderExplorer(e.target.value));
    document.getElementById('search-customer').addEventListener('input', (e) => renderCustomer360(e.target.value));
}

function applyFiltersAndRender() {
    const f = state.filters;
    state.filtered.orders = state.raw.orders.filter(o => {
        return (f.date === 'all' || o.month_name === f.date) &&
               (f.city === 'all' || o.city === f.city) &&
               (f.cuisine === 'all' || o.cuisine === f.cuisine) &&
               (f.restaurant === 'all' || o.restaurant_name === f.restaurant) &&
               (f.segment === 'all' || o.derived_segment === f.segment) &&
               (f.status === 'all' || o.order_status === f.status) &&
               (f.payment === 'all' || o.payment_method === f.payment);
    });
    document.getElementById('header-records').textContent = state.filtered.orders.length;
    renderAllPages();
}

function renderAllPages() {
    renderOverview(); renderSales(); renderCustomer(); renderRestaurant(); 
    renderDelivery(); renderExplorer(''); renderCustomer360(''); renderInsights(); renderDataQuality();
}

// Formatters
const fmtCur = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val || 0);
const fmtNum = (val, dec=2) => Number(val || 0).toFixed(dec);
const shortCur = (v) => v >= 1000 ? '₹' + (v/1000).toFixed(1) + 'K' : '₹' + v.toFixed(0);
const shortNum = (v) => v >= 1000 ? (v/1000).toFixed(1) + 'K' : Math.floor(v);

// Math Helpers
const sum = (arr, key) => arr.reduce((a, b) => a + (Number(b[key]) || 0), 0);
const avg = (arr, key) => arr.length ? sum(arr, key) / arr.length : 0;
const groupBy = (arr, key, metric, aggFn) => {
    const groups = {};
    arr.forEach(item => { const k = item[key] || 'Unknown'; if(!groups[k]) groups[k] = []; groups[k].push(item); });
    return Object.keys(groups).map(k => ({ label: k, value: aggFn(groups[k], metric), items: groups[k] }));
};
const getBadge = (val) => {
    const v = String(val).toLowerCase();
    if(v.includes('deliver') || v.includes('success') || v.includes('high') || v.includes('pass')) return 'badge-success';
    if(v.includes('cancel') || v.includes('fail') || v.includes('delay')) return 'badge-danger';
    if(v.includes('normal') || v.includes('regular') || v.includes('review')) return 'badge-warning';
    return 'badge-primary';
};

// Render Pages
function renderOverview() {
    const data = state.filtered.orders;
    const rev = sum(data, 'order_amount');
    const aov = avg(data, 'order_amount');
    const delivs = data.filter(d => d.order_status === 'Delivered');
    const cancelled = data.filter(d => d.order_status === 'Cancelled').length;
    
    document.getElementById('kpi-orders').textContent = data.length;
    document.getElementById('kpi-revenue').textContent = fmtCur(rev);
    document.getElementById('kpi-aov').textContent = fmtCur(aov);
    document.getElementById('kpi-time').textContent = fmtNum(avg(delivs, 'delivery_time'), 1) + 'm';
    document.getElementById('kpi-rating').textContent = fmtNum(avg(data, 'customer_rating'), 2);
    document.getElementById('kpi-cancel').textContent = fmtNum(data.length ? (cancelled/data.length)*100 : 0, 1) + '%';

    drawSVGLine('overview-rev-trend', groupBy(data, 'order_date', 'order_amount', sum).sort((a,b)=>a.label.localeCompare(b.label)), true, 'Revenue');
    drawSVGDonut('overview-order-status', groupBy(data, 'order_status', '', arr=>arr.length), 'Orders');
    drawSVGBar('overview-rev-city', groupBy(data, 'city', 'order_amount', sum).sort((a,b)=>b.value-a.value), true, 'Revenue');
    drawSVGBar('overview-rev-cuisine', groupBy(data, 'cuisine', 'order_amount', sum).sort((a,b)=>b.value-a.value), true, 'Revenue');
    drawSVGBar('overview-dow', groupBy(data, 'day_name', 'order_amount', sum).sort((a,b)=>b.value-a.value), true, 'Revenue');
    drawSVGDonut('overview-del-cat', groupBy(data, 'delivery_category', '', arr=>arr.length), 'Orders');
}

function renderSales() {
    const data = state.filtered.orders;
    document.getElementById('sales-rev').textContent = fmtCur(sum(data, 'order_amount'));
    document.getElementById('sales-orders').textContent = data.length;
    document.getElementById('sales-aov').textContent = fmtCur(avg(data, 'order_amount'));
    document.getElementById('sales-net').textContent = fmtCur(sum(data, 'net_revenue'));

    drawSVGLine('sales-rev-trend', groupBy(data, 'order_date', 'order_amount', sum).sort((a,b)=>a.label.localeCompare(b.label)), true, 'Revenue');
    drawSVGBar('sales-city', groupBy(data, 'city', 'order_amount', sum).sort((a,b)=>b.value-a.value), true, 'Revenue');
    drawSVGBar('sales-rest', groupBy(data, 'restaurant_name', 'order_amount', sum).sort((a,b)=>b.value-a.value), true, 'Revenue');
    drawSVGBar('sales-cuisine', groupBy(data, 'cuisine', 'order_amount', sum).sort((a,b)=>b.value-a.value), true, 'Revenue');
    drawSVGDonut('sales-payment', groupBy(data, 'payment_method', 'order_amount', sum), 'Revenue');
    drawSVGBar('sales-dow', groupBy(data, 'day_name', 'order_amount', sum).sort((a,b)=>b.value-a.value), true, 'Revenue');

    document.querySelector('#table-sales-summary tbody').innerHTML = `
        <tr><td>Gross Revenue</td><td class="text-primary">${fmtCur(sum(data, 'order_amount'))}</td></tr>
        <tr><td>Net Revenue</td><td class="text-success">${fmtCur(sum(data, 'net_revenue'))}</td></tr>
        <tr><td>Total Discounts</td><td>${fmtCur(sum(data, 'discount'))}</td></tr>
        <tr><td>Delivery Fees</td><td>${fmtCur(sum(data, 'delivery_fee'))}</td></tr>
        <tr><td>Avg Order Value</td><td>${fmtCur(avg(data, 'order_amount'))}</td></tr>
    `;

    const m = groupBy(data, 'month_name', '', arr=>arr).sort((a,b)=>a.items[0].month-b.items[0].month);
    document.querySelector('#sales-month-table tbody').innerHTML = m.map(d => `<tr><td>${d.label}</td><td>${d.value.length}</td><td>${fmtCur(sum(d.value, 'order_amount'))}</td><td>${fmtCur(avg(d.value, 'order_amount'))}</td></tr>`).join('');
}

function renderCustomer() {
    const data = state.filtered.orders;
    const custs = groupBy(data, 'customer_id', '', arr=>arr).sort((a,b)=>sum(b.value, 'order_amount') - sum(a.value, 'order_amount'));
    
    document.getElementById('cust-total').textContent = custs.length;
    document.getElementById('cust-avg-orders').textContent = fmtNum(data.length / (custs.length||1), 1);
    document.getElementById('cust-avg-spend').textContent = fmtCur(sum(data, 'order_amount') / (custs.length||1));
    document.getElementById('cust-rating').textContent = fmtNum(avg(data, 'customer_rating'), 2);

    // Get unique customers for segment distribution
    const uniqueSegments = {};
    custs.forEach(c => {
        const seg = c.value[0].derived_segment;
        uniqueSegments[seg] = (uniqueSegments[seg] || 0) + 1;
    });
    const segmentData = Object.keys(uniqueSegments).map(k => ({label: k, value: uniqueSegments[k]}));
    drawSVGDonut('cust-segment', segmentData, 'Customers');
    
    drawSVGBar('cust-top-chart', custs.slice(0,5).map(c=>({label:c.value[0].customer_name, value:sum(c.value, 'order_amount')})), true, 'Spend');
    drawSVGBar('cust-orders-dist', custs.slice(0,5).map(c=>({label:c.value[0].customer_name, value:c.value.length})), false, 'Orders');

    document.querySelector('#cust-top-table tbody').innerHTML = custs.map(c => `
        <tr onclick="showCustomerDetail('${c.label}')">
            <td>${c.value[0].customer_name}</td><td>${c.label}</td><td>${c.value.length}</td>
            <td>${fmtCur(sum(c.value, 'order_amount'))}</td><td>${fmtCur(avg(c.value, 'order_amount'))}</td>
            <td>${fmtNum(avg(c.value, 'customer_rating'))}</td><td><span class="badge ${getBadge(c.value[0].derived_segment)}">${c.value[0].derived_segment}</span></td>
        </tr>
    `).join('');
}

function renderRestaurant() {
    const data = state.filtered.orders;
    const rests = groupBy(data, 'restaurant_name', '', arr=>arr).sort((a,b)=>sum(b.value, 'order_amount')-sum(a.value, 'order_amount'));
    const cuis = groupBy(data, 'cuisine', '', arr=>arr).sort((a,b)=>sum(b.value, 'order_amount')-sum(a.value, 'order_amount'));

    document.getElementById('rest-total').textContent = rests.length;
    document.getElementById('rest-rev').textContent = fmtCur(sum(data, 'order_amount'));
    document.getElementById('rest-aov').textContent = fmtCur(avg(data, 'order_amount'));
    document.getElementById('rest-rating').textContent = fmtNum(avg(data, 'customer_rating'), 2);

    drawSVGBar('rest-top-rev', rests.slice(0,5).map(r=>({label:r.label, value:sum(r.value, 'order_amount')})), true, 'Revenue');
    drawSVGBar('rest-top-orders', rests.slice(0,5).map(r=>({label:r.label, value:r.value.length})), false, 'Orders');
    drawSVGBar('rest-cuisine-rev', cuis.slice(0,5).map(c=>({label:c.label, value:sum(c.value, 'order_amount')})), true, 'Revenue');
    drawSVGBar('rest-cuisine-rating', cuis.slice(0,5).map(c=>({label:c.label, value:avg(c.value, 'customer_rating')})), false, 'Avg Rating');

    document.querySelector('#rest-table tbody').innerHTML = rests.map(r => `
        <tr><td>${r.label}</td><td>${r.value[0].city}</td><td>${r.value[0].cuisine}</td>
            <td>${r.value.length}</td><td>${fmtCur(sum(r.value, 'order_amount'))}</td>
            <td>${fmtCur(avg(r.value, 'order_amount'))}</td><td>${fmtNum(avg(r.value, 'customer_rating'))}</td>
            <td>${fmtNum(avg(r.value, 'delivery_time'), 0)}m</td></tr>
    `).join('');
}

function renderDelivery() {
    const data = state.filtered.orders;
    const delivs = data.filter(d => d.order_status === 'Delivered');
    const tot = delivs.length || 1;
    
    document.getElementById('del-avg-time').textContent = fmtNum(avg(delivs, 'delivery_time'), 1) + 'm';
    document.getElementById('del-fast').textContent = fmtNum((delivs.filter(d=>d.delivery_time<=30).length/tot)*100, 1) + '%';
    document.getElementById('del-norm').textContent = fmtNum((delivs.filter(d=>d.delivery_time>30&&d.delivery_time<=60).length/tot)*100, 1) + '%';
    document.getElementById('del-delay').textContent = fmtNum((delivs.filter(d=>d.delivery_time>60).length/tot)*100, 1) + '%';
    document.getElementById('del-cancel').textContent = fmtNum((data.filter(d=>d.order_status==='Cancelled').length/(data.length||1))*100, 1) + '%';

    drawSVGDonut('del-cat-dist', groupBy(data, 'delivery_category', '', arr=>arr.length), 'Orders');
    drawSVGBar('del-perf-city', groupBy(delivs, 'city', 'delivery_time', avg).sort((a,b)=>a.value-b.value), false, 'Avg Time (min)');
    drawSVGBar('del-time-rest', groupBy(delivs, 'restaurant_name', 'delivery_time', avg).sort((a,b)=>a.value-b.value), false, 'Avg Time (min)');
    drawSVGBar('del-cat-rating', groupBy(data, 'delivery_category', 'customer_rating', avg).sort((a,b)=>b.value-a.value), false, 'Avg Rating');

    const cats = groupBy(data, 'order_status', '', arr=>arr);
    document.querySelector('#del-table tbody').innerHTML = cats.map(c => `
        <tr><td><span class="badge ${getBadge(c.label)}">${c.label}</span></td><td>${c.value.length}</td>
            <td>${fmtNum(avg(c.value, 'delivery_time'), 1)}m</td><td>${fmtNum(avg(c.value, 'customer_rating'), 2)}</td></tr>
    `).join('');
}

function renderExplorer(term) {
    term = term.toLowerCase();
    const data = state.filtered.orders.filter(d => String(d.order_id).toLowerCase().includes(term) || String(d.customer_name).toLowerCase().includes(term) || String(d.restaurant_name).toLowerCase().includes(term));
    document.querySelector('#table-orders tbody').innerHTML = data.slice(0, 100).map(o => `
        <tr onclick="showOrderDetail('${o.order_id}')">
            <td>#${o.order_id}</td><td>${o.customer_name}</td><td>${o.restaurant_name}</td>
            <td>${o.city}</td><td>${o.cuisine}</td><td>${o.order_date}</td>
            <td>${fmtCur(o.order_amount)}</td><td>${fmtCur(o.delivery_fee)}</td>
            <td>${o.customer_rating}</td><td><span class="badge ${getBadge(o.order_status)}">${o.order_status}</span></td>
        </tr>
    `).join('');
}

function renderCustomer360(term) {
    term = term.toLowerCase();
    const custs = groupBy(state.filtered.orders, 'customer_id', '', arr=>arr);
    const data = custs.filter(c => c.label.toLowerCase().includes(term) || c.value[0].customer_name.toLowerCase().includes(term)).sort((a,b)=>sum(b.value, 'order_amount')-sum(a.value, 'order_amount'));
    
    document.querySelector('#table-customer360 tbody').innerHTML = data.slice(0, 100).map(c => `
        <tr onclick="showCustomerDetail('${c.label}')">
            <td>${c.label}</td><td>${c.value[0].customer_name}</td><td>${c.value.length}</td>
            <td>${fmtCur(sum(c.value, 'order_amount'))}</td><td>${fmtCur(avg(c.value, 'order_amount'))}</td>
            <td>${fmtNum(avg(c.value, 'customer_rating'))}</td><td><span class="badge ${getBadge(c.value[0].derived_segment)}">${c.value[0].derived_segment}</span></td>
        </tr>
    `).join('');
}

function renderInsights() {
    const data = state.filtered.orders;
    const cont = document.getElementById('insights-container');
    if(!data.length) { cont.innerHTML = '<div class="chart-empty">No data available</div>'; return; }

    const i = [];
    const cities = groupBy(data, 'city', 'order_amount', sum).sort((a,b)=>b.value-a.value);
    if(cities.length) i.push(`<b>${cities[0].label}</b> generated the highest revenue overall at <span class="text-primary">${fmtCur(cities[0].value)}</span>.`);
    const rests = groupBy(data, 'restaurant_name', 'order_amount', sum).sort((a,b)=>b.value-a.value);
    if(rests.length) i.push(`<b>${rests[0].label}</b> is the top-performing restaurant with <span class="text-primary">${fmtCur(rests[0].value)}</span> in revenue.`);
    const cuis = groupBy(data, 'cuisine', 'order_amount', sum).sort((a,b)=>b.value-a.value);
    if(cuis.length) i.push(`<b>${cuis[0].label}</b> cuisine leads the category with <span class="text-primary">${fmtCur(cuis[0].value)}</span>.`);
    const cancel = data.filter(d=>d.order_status==='Cancelled').length;
    i.push(cancel > 0 ? `There are <b>${cancel} cancelled orders</b>, resulting in a cancellation rate of <span class="text-danger">${fmtNum((cancel/data.length)*100,1)}%</span>.` : `Excellent fulfillment with a <span class="text-success">0% cancellation rate</span>.`);
    
    cont.innerHTML = i.map(txt => `<div class="chart-card" style="justify-content:center"><p style="font-size:14px; line-height:1.6">${txt}</p></div>`).join('');
}

function renderDataQuality() {
    const data = state.raw.orders;
    const missing = data.filter(d => Object.values(d).some(v => v === '' || v === null)).length;
    const dups = data.length - new Set(data.map(d => d.order_id)).size;
    const invRat = data.filter(d => d.customer_rating < 0 || d.customer_rating > 5).length;
    const invTime = data.filter(d => d.delivery_time < 0).length;
    const isPass = missing === 0 && dups === 0 && invRat === 0 && invTime === 0;

    document.getElementById('dq-status-val').className = isPass ? 'text-success' : 'text-warning';
    document.getElementById('dq-status-val').textContent = isPass ? 'PASS' : 'REVIEW';

    document.getElementById('dq-kpis').innerHTML = `
        <div class="kpi-card"><div class="kpi-label">Rows Loaded</div><div class="kpi-value">${data.length}</div></div>
        <div class="kpi-card"><div class="kpi-label">Duplicates</div><div class="kpi-value ${dups>0?'text-danger':''}">${dups}</div></div>
        <div class="kpi-card"><div class="kpi-label">Missing Values</div><div class="kpi-value ${missing>0?'text-warning':''}">${missing}</div></div>
        <div class="kpi-card"><div class="kpi-label">Invalid Bounds</div><div class="kpi-value ${invRat+invTime>0?'text-danger':''}">${invRat+invTime}</div></div>
    `;

    const v = state.raw.validation;
    document.querySelector('#table-validation tbody').innerHTML = (v && v.length) ? v.map(row => {
        const status = row.Status || row.result || 'UNKNOWN';
        return `<tr><td>${row.Check || Object.values(row)[0]}</td><td><span class="badge ${getBadge(status)}">${status}</span></td></tr>`;
    }).join('') : `<tr><td colspan="2">Validation file not found.</td></tr>`;
}

// --- Dynamic SVG Charts ---
function drawSVGBar(id, data, isCur=false, metricLabel='') {
    const el = document.getElementById(id);
    if(!data.length) { el.innerHTML = '<div class="chart-empty">No data</div>'; return; }
    const max = Math.max(...data.map(d=>d.value));
    
    let html = `<div class="js-bar-container">`;
    html += data.map((d,i) => {
        const p = max ? (d.value/max)*100 : 0;
        const v = isCur ? fmtCur(d.value) : fmtNum(d.value, d.value%1===0?0:2);
        return `
        <div class="js-bar-row hover-target" data-title="${d.label}" data-val="${metricLabel}: ${v}">
            <div class="js-bar-label">${d.label}</div>
            <div class="js-bar-track"><div class="js-bar-fill" style="width:${p}%; background:${state.colors[i%state.colors.length]}"></div></div>
            <div class="js-bar-value">${isCur ? shortCur(d.value) : shortNum(d.value)}</div>
        </div>`;
    }).join('');
    html += `</div>`;
    el.innerHTML = html;
}

function drawSVGDonut(id, data, metricLabel='') {
    const el = document.getElementById(id);
    if(!data.length) { el.innerHTML = '<div class="chart-empty">No data</div>'; return; }
    const tot = sum(data, 'value');
    let ang = 0;
    const svg = data.map((d,i) => {
        const fr = tot ? d.value/tot : 0;
        const da = `${fr*100} 100`; const doff = -ang*100; ang+=fr;
        const valStr = metricLabel ? `${metricLabel}: ${d.value}` : d.value;
        const subStr = `Share: ${fmtNum(fr*100, 1)}%`;
        return `<circle cx="21" cy="21" r="15.915" fill="none" stroke="${state.colors[i%state.colors.length]}" stroke-width="6" stroke-dasharray="${da}" stroke-dashoffset="${doff}" class="donut-segment hover-target" data-title="${d.label}" data-val="${valStr}" data-sub="${subStr}"></circle>`;
    }).join('');
    const leg = data.map((d,i) => `<div class="legend-item hover-target" data-title="${d.label}" data-val="${metricLabel}: ${d.value}"><div class="legend-dot" style="background:${state.colors[i%state.colors.length]}"></div><span>${d.label}</span></div>`).join('');
    el.innerHTML = `<div class="donut-wrapper"><svg viewBox="0 0 42 42" class="donut-svg">${svg}</svg><div class="donut-legend">${leg}</div></div>`;
}

function drawSVGLine(id, data, isCur=false, metricLabel='') {
    const el = document.getElementById(id);
    if(data.length < 2) { el.innerHTML = '<div class="chart-empty">Not enough data for trend</div>'; return; }
    
    // Calculate layout bounds dynamically to fit the container perfectly
    const w = el.clientWidth || 400;
    const h = el.clientHeight || 200;
    const padL = 40, padB = 25, padT = 10, padR = 15;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;
    
    const maxVal = Math.max(...data.map(d=>d.value));
    const yTicks = 4;
    
    // Grid Lines & Y-Axis text
    let gridHTML = '';
    for(let i=0; i<=yTicks; i++) {
        const y = padT + chartH - (i/yTicks)*chartH;
        const val = (i/yTicks)*maxVal;
        gridHTML += `<line x1="${padL}" y1="${y}" x2="${w-padR}" y2="${y}" class="svg-grid-line" />`;
        gridHTML += `<text x="${padL - 8}" y="${y}" class="svg-axis-text" text-anchor="end" dominant-baseline="middle">${isCur ? shortCur(val) : shortNum(val)}</text>`;
    }
    
    // Line & Area coordinates
    const pts = data.map((d,i) => {
        const cx = padL + (i/(data.length-1)) * chartW;
        const cy = padT + chartH - (maxVal ? (d.value/maxVal)*chartH : 0);
        return `${cx},${cy}`;
    });
    const poly = pts.join(' ');
    const area = `${padL},${padT + chartH} ${poly} ${padL + chartW},${padT + chartH}`;
    
    // X-Axis Text (just start, middle, end if too many, or all if few)
    let xLabels = '';
    const step = Math.ceil(data.length / Math.min(data.length, 6)); // show max 6 labels
    data.forEach((d,i) => {
        if(i % step === 0 || i === data.length - 1) {
            const cx = padL + (i/(data.length-1)) * chartW;
            const label = d.label.split('-')[1] || d.label.substring(0,5); // short dates
            xLabels += `<text x="${cx}" y="${h - 5}" class="svg-axis-text" text-anchor="middle">${label}</text>`;
        }
    });

    const dots = data.map((d,i) => {
        const coord = pts[i].split(',');
        const valStr = isCur ? fmtCur(d.value) : d.value;
        return `<circle cx="${coord[0]}" cy="${coord[1]}" r="4" fill="var(--card-bg)" stroke="var(--primary)" class="svg-dot hover-target" data-title="${d.label}" data-val="${metricLabel}: ${valStr}"></circle>`;
    }).join('');

    el.innerHTML = `<svg class="svg-chart" viewBox="0 0 ${w} ${h}">
        ${gridHTML}
        ${xLabels}
        <polygon points="${area}" fill="var(--primary)" class="svg-area" />
        <polyline points="${poly}" class="svg-line" stroke="var(--primary)" />
        ${dots}
    </svg>`;
}

// --- Tooltip System ---
function initTooltip() {
    const tooltip = document.getElementById('chart-tooltip');
    document.addEventListener('mouseover', e => {
        const el = e.target.closest('.hover-target');
        if(el) {
            const title = el.getAttribute('data-title');
            const val = el.getAttribute('data-val');
            const sub = el.getAttribute('data-sub');
            tooltip.innerHTML = `<div class="tooltip-title">${title}</div><div class="tooltip-val">${val}</div>${sub ? `<div class="tooltip-sub">${sub}</div>` : ''}`;
            tooltip.classList.add('active');
        }
    });
    document.addEventListener('mousemove', e => {
        if(tooltip.classList.contains('active')) {
            // Position relative to viewport edges to prevent clipping
            let x = e.clientX + 15;
            let y = e.clientY + 15;
            if (x + tooltip.offsetWidth > window.innerWidth) x = e.clientX - tooltip.offsetWidth - 10;
            if (y + tooltip.offsetHeight > window.innerHeight) y = e.clientY - tooltip.offsetHeight - 10;
            tooltip.style.left = x + 'px';
            tooltip.style.top = y + 'px';
        }
    });
    document.addEventListener('mouseout', e => {
        if(e.target.closest('.hover-target')) tooltip.classList.remove('active');
    });
}

// --- Modals ---
function showOrderDetail(id) {
    const o = state.raw.orders.find(x => String(x.order_id) === String(id));
    if(!o) return;
    document.getElementById('modal-title').textContent = `Order #${o.order_id}`;
    document.getElementById('modal-body').innerHTML = Object.entries(o).map(([k,v]) => `<div class="detail-row"><span class="detail-label">${k.replace('_', ' ')}</span><span class="detail-value">${v}</span></div>`).join('');
    document.getElementById('modal-table-container').innerHTML = '';
    document.getElementById('detail-modal').classList.add('active');
}

function showCustomerDetail(id) {
    const ords = state.raw.orders.filter(x => String(x.customer_id) === String(id));
    if(!ords.length) return;
    const c = ords[0];
    document.getElementById('modal-title').textContent = `Customer: ${c.customer_name}`;
    document.getElementById('modal-body').innerHTML = `
        <div class="detail-row"><span class="detail-label">Customer ID</span><span class="detail-value">${c.customer_id}</span></div>
        <div class="detail-row"><span class="detail-label">Segment</span><span class="detail-value"><span class="badge ${getBadge(c.derived_segment)}">${c.derived_segment}</span></span></div>
        <div class="detail-row"><span class="detail-label">Total Orders</span><span class="detail-value">${ords.length}</span></div>
        <div class="detail-row"><span class="detail-label">Total Spend</span><span class="detail-value text-primary">${fmtCur(sum(ords, 'order_amount'))}</span></div>
    `;
    document.getElementById('modal-table-container').innerHTML = `
        <h4 style="margin: 16px 0; font-size: 13px; color: var(--text-muted)">Recent Orders</h4>
        <table class="data-table"><thead><tr><th>Order ID</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
        <tbody>${ords.map(o=>`<tr><td>#${o.order_id}</td><td>${o.order_date}</td><td>${fmtCur(o.order_amount)}</td><td><span class="badge ${getBadge(o.order_status)}">${o.order_status}</span></td></tr>`).join('')}</tbody></table>
    `;
    document.getElementById('detail-modal').classList.add('active');
}

document.getElementById('modal-close').addEventListener('click', () => document.getElementById('detail-modal').classList.remove('active'));

// --- Navigation ---
function initNavigation() {
    const items = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    const title = document.getElementById('page-title');
    const side = document.getElementById('sidebar');

    items.forEach(i => i.addEventListener('click', () => {
        items.forEach(n => n.classList.remove('active'));
        pages.forEach(p => p.classList.remove('active'));
        i.classList.add('active');
        document.getElementById(i.getAttribute('data-target')).classList.add('active');
        title.textContent = i.getAttribute('data-title');
        if(window.innerWidth <= 768) side.classList.remove('open');
        // Render charts when they become visible to calculate correct SVG bounds
        setTimeout(() => renderAllPages(), 50); 
    }));

    document.getElementById('mobileMenuBtn').addEventListener('click', () => side.classList.add('open'));
    document.getElementById('mobileCloseBtn').addEventListener('click', () => side.classList.remove('open'));
}
