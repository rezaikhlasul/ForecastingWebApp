const fs = require('fs');

const headers = ['Tanggal_Transaksi', 'Nama_Barang', 'Lokasi', 'Pendapatan', 'Jml_Terjual', 'Keuntungan', 'Tipe_Kustomer', 'Catatan_Internal'];
const products = ['Laptop', 'Phone', 'Tablet', 'Monitor', 'Keyboard'];
const regions = ['Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Bali'];
const customerTypes = ['Enterprise', 'SMB', 'Consumer'];

let csvContent = headers.join(',') + '\n';
for (let i = 0; i < 50; i++) {
    const date = new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1);
    const product = products[Math.floor(Math.random() * products.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    const qty = Math.floor(Math.random() * 50) + 1;

    // Messy formatting
    const revenueStr = 'Rp ' + Math.floor((Math.random() * 5000 + 500) * qty / 10).toLocaleString('en-US') + '.00';
    const profitStr = 'Rp ' + Math.floor((Math.random() * 5000 + 500) * qty / 10 * 0.2).toLocaleString('en-US');
    const customerType = ' ' + customerTypes[Math.floor(Math.random() * customerTypes.length)] + ' ';
    const notes = `Pemesanan ${Math.random().toString(36).substring(7)}`;

    csvContent += `${date.toISOString().split('T')[0]},${product},${region},"${revenueStr}",${qty},"${profitStr}",${customerType},${notes}\n`;
}

fs.writeFileSync('test_messy_data.csv', csvContent);
console.log('Created test_messy_data.csv');
