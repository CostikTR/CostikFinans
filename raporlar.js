document.addEventListener("DOMContentLoaded", function () {
  // DOM elemanlarını seç
  const totalIncomeEl = document.getElementById("total-income");
  const totalExpenseEl = document.getElementById("total-expense");
  const netBalanceEl = document.getElementById("net-balance");
  const ctx = document.getElementById("myChart")?.getContext("2d");

  // localStorage'dan verileri al, veri yoksa boş bir dizi kullan
  const transactions = JSON.parse(localStorage.getItem("transactions")) || [];

  // Rapor verilerini hesapla
  const amounts = transactions.map((transaction) => transaction.amount);

  const totalIncome = amounts
    .filter((item) => item > 0)
    .reduce((acc, item) => (acc += item), 0)
    .toFixed(2);

  const totalExpense = (
    amounts.filter((item) => item < 0).reduce((acc, item) => (acc += item), 0) *
    -1
  ).toFixed(2);

  const netBalance = (totalIncome - totalExpense).toFixed(2);

  // DOM'u hesaplanan verilerle güncelle
  totalIncomeEl.innerText = `${totalIncome} ₺`;
  totalExpenseEl.innerText = `${totalExpense} ₺`;
  netBalanceEl.innerText = `${netBalance} ₺`;

  // Net duruma göre renk sınıfı ekle
  if (netBalance < 0) {
    netBalanceEl.classList.add("expense");
  } else {
    netBalanceEl.classList.add("income");
  }

  // Eğer grafiği çizecek alan varsa ve veri mevcutsa Chart.js ile grafik oluştur
  if (ctx && (totalIncome > 0 || totalExpense > 0)) {
    new Chart(ctx, {
      type: "doughnut", // Grafik tipi: dairesel
      data: {
        labels: ["Gelir", "Gider"],
        datasets: [
          {
            label: "Finansal Durum",
            data: [totalIncome, totalExpense],
            backgroundColor: [
              "rgba(40, 167, 69, 0.7)", // Yeşil (Gelir)
              "rgba(220, 53, 69, 0.7)", // Kırmızı (Gider)
            ],
            borderColor: ["#28a745", "#dc3545"],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false, // Konteyner boyutuna uyum sağla
        plugins: {
          legend: {
            position: "top",
          },
          title: {
            display: false,
          },
        },
      },
    });
  } else if (ctx) {
    // Eğer veri yoksa kullanıcıya bilgi ver
    ctx.font = "16px Arial";
    ctx.fillStyle = "#666";
    ctx.textAlign = "center";
    ctx.fillText("Grafiği görüntülemek için işlem ekleyin.", ctx.canvas.width / 2, ctx.canvas.height / 2);
  }
});