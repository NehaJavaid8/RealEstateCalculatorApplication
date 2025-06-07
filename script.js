document.addEventListener("DOMContentLoaded", function () { 
    const form = document.getElementById("realEstateForm");

    // Add event listeners to all input fields
    form.querySelectorAll("input").forEach((input) => {
        input.addEventListener("input", calculateAll);
    });

    // PDF Button Event Listener
    document.getElementById("pdfButton").addEventListener("click", generatePDF);

    function calculateAll() {
        // Clear error message
        document.getElementById("errorMessage").textContent = "";

        // Get input values
        const width = parseFloat(document.getElementById("width").value) || 0;
        const length = parseFloat(document.getElementById("length").value) || 0;
        const rate = parseFloat(document.getElementById("rate").value) || 0;
        const downpaymentPercentage = parseFloat(document.getElementById("downpaymentPercentage").value) || 0;
        const confirmationPercentage = parseFloat(document.getElementById("confirmationPercentage").value) || 0;
        const noOfQuarters = parseFloat(document.getElementById("noOfQuarters").value) || 0;
        const quarterPercentage = parseFloat(document.getElementById("quarterPercentage").value) || 0;
        const noOfMonths = parseFloat(document.getElementById("noOfMonths").value) || 0;
        const perMonthPercentage = parseFloat(document.getElementById("perMonthPercentage").value) || 0;
        const possessionPercentage = parseFloat(document.getElementById("possessionPercentage").value) || 0;

        // Calculate Area
        const area = width * length;
        document.getElementById("area").value = area;

        // Calculate Total Amount
        const totalAmount = area * rate;
        document.getElementById("totalAmount").value = totalAmount;

        // Calculate Downpayment Amount
        const downpaymentAmount = totalAmount * (downpaymentPercentage / 100);
        document.getElementById("downpaymentAmount").value = downpaymentAmount;

        // Calculate Confirmation Amount
        const confirmationAmount = totalAmount * (confirmationPercentage / 100);
        document.getElementById("confirmationAmount").value = confirmationAmount;

        // Calculate Quarterly
        const quarterTotalPercentage = noOfQuarters * quarterPercentage;
        const quarterAmount = totalAmount * (quarterTotalPercentage / 100);
        const perQuarterAmount = quarterAmount / noOfQuarters || 0;
        document.getElementById("quarterTotalPercentage").value = quarterTotalPercentage;
        document.getElementById("quarterAmount").value = quarterAmount;
        document.getElementById("perQuarterAmount").value = perQuarterAmount;

        // Calculate Monthly
        const monthTotalPercentage = noOfMonths * perMonthPercentage;
        const monthlyAmount = totalAmount * (monthTotalPercentage / 100);
        const perMonthAmount = monthlyAmount / noOfMonths || 0;
        document.getElementById("monthTotalPercentage").value = monthTotalPercentage;
        document.getElementById("monthlyAmount").value = monthlyAmount;
        document.getElementById("perMonthAmount").value = perMonthAmount;

        // Calculate Possession
        const possession = totalAmount * (possessionPercentage / 100);
        document.getElementById("possession").value = possession;

        // Calculate Total
        const total = downpaymentAmount + confirmationAmount + quarterAmount + monthlyAmount + possession;
        document.getElementById("total").value = total;

        // Updated Difference Formula
        const difference = 100-(downpaymentPercentage + confirmationPercentage + quarterTotalPercentage + monthTotalPercentage + possessionPercentage);
        document.getElementById("difference").value = difference;

        // Check if Possession exceeds Total
        if (possession > totalAmount) {
            document.getElementById("errorMessage").textContent = "Possession exceeds 100% of Total.";
        }

        // Generate Payment Plan
        generatePaymentPlan(downpaymentAmount, confirmationAmount, perMonthAmount, noOfMonths, perQuarterAmount, noOfQuarters, possession);
    }

    function generatePaymentPlan(downpaymentAmount, confirmationAmount, perMonthAmount, noOfMonths, perQuarterAmount, noOfQuarters, possession) {
        const paymentPlanTable = document.getElementById("paymentPlanTable").getElementsByTagName('tbody')[0];
        paymentPlanTable.innerHTML = ""; // Clear existing rows

        let currentDate = new Date();
        const monthNames = ["January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"];

        // 1. Downpayment (Today's date)
        addPaymentRow(paymentPlanTable, currentDate, "Downpayment", downpaymentAmount);

        // 2. Confirmation (7 days after downpayment)
        let confirmationDate = new Date(currentDate);
        confirmationDate.setDate(confirmationDate.getDate() + 7);
        addPaymentRow(paymentPlanTable, confirmationDate, "Confirmation", confirmationAmount);

        // Start from next month's same day
        let installmentDate = new Date(confirmationDate);
        installmentDate.setMonth(installmentDate.getMonth() + 1);
        installmentDate.setDate(currentDate.getDate());

        let quarterCounter = 0;
        let monthCounter = 0;

        for (let i = 1; i <= noOfMonths; i++) {
            // Monthly installment
            addPaymentRow(paymentPlanTable, 
                         new Date(installmentDate), 
                         `Monthly Installment ${i}`, 
                         perMonthAmount);
            
            monthCounter++;
            
            // Move to next month (same day)
            installmentDate.setMonth(installmentDate.getMonth() + 1);

            // Quarterly after every 2 monthly
            if (monthCounter % 2 === 0 && quarterCounter < noOfQuarters) {
                addPaymentRow(paymentPlanTable,
                             new Date(installmentDate),
                             `Quarterly Installment ${quarterCounter + 1}`,
                             perQuarterAmount);
                quarterCounter++;
                installmentDate.setMonth(installmentDate.getMonth() + 1);
            }
        }

        // Possession (next month after last payment)
        addPaymentRow(paymentPlanTable, new Date(installmentDate), "Possession", possession);
    }

    function addPaymentRow(table, date, type, amount) {
        const row = table.insertRow();
        const dueDateCell = row.insertCell(0);
        const typeCell = row.insertCell(1);
        const amountCell = row.insertCell(2);

        // Format date as DD-MM-YYYY
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const formattedDate = `${day}-${month}-${year}`;

        dueDateCell.textContent = formattedDate;
        typeCell.textContent = type;
        amountCell.textContent = amount.toFixed(2);
    }

    function generatePDF() {
        const { jsPDF } = window.jspdf;

        // Capture the table as an image using html2canvas
        html2canvas(document.getElementById("paymentPlanTable")).then((canvas) => {
            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF("p", "mm", "a4");

            // Add the image to the PDF
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

            // Save the PDF
            pdf.save("PaymentPlan.pdf");
        });
    }
});