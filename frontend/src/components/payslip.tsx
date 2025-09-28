import React from "react";

interface PaySlipProps {
  currentCalculation?: any;
}

export const PaySlip = React.memo(({ currentCalculation }: PaySlipProps) => {
  if (!currentCalculation) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-sm">Select an employee to view pay slip</p>
        </div>
      </div>
    );
  }

  // Get current month and year
  const currentDate = new Date();
  const monthYear = currentDate.toLocaleDateString('en-US', { 
    month: 'short', 
    year: '2-digit' 
  }).replace(' ', '-');

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN');
  };

  // Calculate values from currentCalculation
  const {
    employeeNo = '',
    name = '',
    dependants = 0,
    salary = 0,
    augSalary = 0,
    ot15 = 0,
    ot20 = 0,
    ot30 = 0,
    allowanceTax = 0,
    bonus = 0,
    totalSalary = 0,
    personalRelief = 0,
    dependentRelief = 0,
    employeeInsurance = 0,
    unionFee = 0,
    assessableIncome = 0,
    personalIncomeTax = 0,
    totalNetIncome = 0,
    totalOTHours = 0,
    overtimePayNonPIT = 0,
    overtimePayPIT = 0,
    advance = 0
  } = currentCalculation;

  // Use all calculated values directly from the form - no redundant calculations
  // This ensures real-time sync with the calculation form
  const displayTotalOTHours = totalOTHours || 0;
  const combinedOvertimePay = (overtimePayPIT || 0) + (overtimePayNonPIT || 0);
  
  // Debug: Log when PaySlip re-renders to verify real-time updates
  // console.log('PaySlip re-rendered with:', { name, totalSalary, totalNetIncome, calculatedAt: currentCalculation?.calculatedAt });

  return (
    <div className="h-full pt-0 px-2 pb-2 bg-white text-black text-[13px] font-sans">
      {/* Header */}
      <div className="text-center mb-0.5">
        <h1 className="text-[20px] font-bold text-orange-500 tracking-wider">PAY SLIP</h1>
        <div className="text-right text-[13px] mt-0.5">
          <span className="text-green-600 font-medium">Month: {monthYear}</span>
        </div>
      </div>

       {/* Employee Information */}
       <table className="w-full mb-2 border-collapse">
         <colgroup>
           <col className="w-[25%]" />
           <col className="w-[38%]" />
           <col className="w-[18%]" />
           <col className="w-[19%]" />
         </colgroup>
         <tbody>
           <tr>
             <td className="border border-gray-400 px-1 py-0.5 font-medium bg-gray-100">Employee ID</td>
             <td className="border border-gray-400 px-1 py-0.5 text-center">{employeeNo}</td>
             <td className="border border-gray-400 px-1 py-0.5 font-medium bg-gray-100 text-center" colSpan={2}>AL balance up to Month: (hrs)</td>
           </tr>
           <tr>
             <td className="border border-gray-400 px-1 py-0.5 font-medium bg-gray-100">Full name</td>
             <td className="border border-gray-400 px-1 py-0.5 text-center">{name}</td>
             <td className="border border-gray-400 px-1 py-0.5 text-center" colSpan={2}>-</td>
           </tr>
           <tr>
             <td className="border border-gray-400 px-1 py-0.5 font-medium bg-gray-100">Number of dependants</td>
             <td className="border border-gray-400 px-1 py-0.5 text-center">{dependants}</td>
             <td className="border border-gray-400 px-1 py-0.5" colSpan={2}></td>
           </tr>
         </tbody>
       </table>

       {/* A. Salary and Allowance */}
       <table className="w-full mb-1 border-collapse">
         <colgroup>
           <col className="w-[6%]" />
           <col className="w-[38%]" />
           <col className="w-[13.5%]" />
           <col className="w-[13.5%]" />
           <col className="w-[29%]" />
         </colgroup>
         <thead>
           <tr>
             <td className="border border-gray-400 px-1 py-0.5 font-bold bg-gray-100" colSpan={2}>
               A. Salary and Allowance
             </td>
             <td className="border border-gray-400 px-1 py-0.5 text-center font-italic text-gray-600 text-[13px]" colSpan={2}>
               (A)=(1)+(2)+(3)+(4)
             </td>
             <td className="border border-gray-400 px-1 py-0.5 text-right font-bold">{totalSalary > 0 ? formatCurrency(totalSalary) + ' VND' : '- VND'}</td>
           </tr>
         </thead>
        <tbody>
           <tr>
             <td className="border border-gray-400 px-1 py-0.5 w-8 text-center text-blue-600">1</td>
             <td className="border border-gray-400 px-1 py-0.5 text-blue-600">Day-work salary</td>
             <td className="border border-gray-400 px-1 py-0.5 text-center" colSpan={2}>-</td>
             <td className="border border-gray-400 px-1 py-0.5 text-right">{augSalary > 0 ? formatCurrency(augSalary) : '-'}</td>
           </tr>
           <tr>
             <td className="border border-gray-400 px-1 py-0.5 text-center text-blue-600">2</td>
             <td className="border border-gray-400 px-1 py-0.5 text-blue-600">Over Time</td>
             <td className="border border-gray-400 px-1 py-0.5 text-center text-red-500">{displayTotalOTHours > 0 ? displayTotalOTHours : '-'}</td>
             <td className="border border-gray-400 px-1 py-0.5 text-center text-red-500">hours</td>
             <td className="border border-gray-400 px-1 py-0.5 text-right">{combinedOvertimePay > 0 ? formatCurrency(combinedOvertimePay) : '-'}</td>
           </tr>
           <tr>
             <td className="border border-gray-400 px-1 py-0.5 text-center text-blue-600">3</td>
             <td className="border border-gray-400 px-1 py-0.5 text-blue-600">Allowance must pay PIT</td>
             <td className="border border-gray-400 px-1 py-0.5 text-center" colSpan={2}>-</td>
             <td className="border border-gray-400 px-1 py-0.5 text-right">{allowanceTax > 0 ? formatCurrency(allowanceTax) : '-'}</td>
           </tr>
            <tr>
              <td className="border border-gray-400 px-1 py-0.5 text-center text-blue-600">4</td>
              <td className="border border-gray-400 px-1 py-0.5 text-blue-600">Bonus</td>
              <td className="border border-gray-400 px-1 py-0.5 text-center" colSpan={2}>-</td>
              <td className="border border-gray-400 px-1 py-0.5 text-right">{bonus > 0 ? formatCurrency(bonus) : '-'}</td>
            </tr>
            <tr>
              <td colSpan={5} className="py-2"></td>
            </tr>
        </tbody>
      </table>

      {/* B. Total Income */}
      <table className="w-full mb-1 border-collapse">
        <colgroup>
          <col className="w-[6%]" />
          <col className="w-[38%]" />
          <col className="w-[27%]" />
          <col className="w-[29%]" />
        </colgroup>
        <tbody>
          <tr>
            <td className="border border-gray-400 px-1 py-0.5 font-bold bg-gray-100" colSpan={2}>
              B. Total Income (Tổng thu nhập)
            </td>
            <td className="border border-gray-400 px-1 py-0.5 text-center font-italic text-gray-600 text-[13px]">
              (B)=(A)
            </td>
            <td className="border border-gray-400 px-1 py-0.5 text-right font-bold">{totalSalary > 0 ? formatCurrency(totalSalary) + ' VND' : '- VND'}</td>
          </tr>
          <tr>
            <td colSpan={4} className="py-2"></td>
          </tr>
        </tbody>
      </table>

      {/* C. Tax deductions */}
      <table className="w-full mb-1 border-collapse">
        <colgroup>
          <col className="w-[6%]" />
          <col className="w-[38%]" />
          <col className="w-[27%]" />
          <col className="w-[29%]" />
        </colgroup>
        <thead>
          <tr>
            <td className="border border-gray-400 px-1 py-0.5 font-bold bg-gray-100" colSpan={2}>
              C. Tax deductions (giảm trừ thuế TNCN)
            </td>
            <td className="border border-gray-400 px-1 py-0.5 text-center font-italic text-gray-600 text-[13px]">
              (C)=(4)+(5)
            </td>
            <td className="border border-gray-400 px-1 py-0.5 text-right font-bold">{personalRelief + dependentRelief > 0 ? formatCurrency(personalRelief + dependentRelief) + ' VND' : '- VND'}</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-400 px-1 py-0.5 w-8 text-center text-blue-600">4</td>
            <td className="border border-gray-400 px-1 py-0.5 text-blue-600">Personal relief</td>
            <td className="border border-gray-400 px-1 py-0.5 text-center">-</td>
            <td className="border border-gray-400 px-1 py-0.5 text-right">{personalRelief > 0 ? formatCurrency(personalRelief) : '-'}</td>
          </tr>
          <tr>
            <td className="border border-gray-400 px-1 py-0.5 text-center text-blue-600">5</td>
            <td className="border border-gray-400 px-1 py-0.5 text-blue-600">Dependent relief</td>
            <td className="border border-gray-400 px-1 py-0.5 text-center">-</td>
            <td className="border border-gray-400 px-1 py-0.5 text-right">{dependentRelief > 0 ? formatCurrency(dependentRelief) : '-'}</td>
          </tr>
          <tr>
            <td colSpan={4} className="py-2"></td>
          </tr>
        </tbody>
      </table>

      {/* D. Insurance contribution */}
      <table className="w-full mb-1 border-collapse">
        <colgroup>
          <col className="w-[6%]" />
          <col className="w-[38%]" />
          <col className="w-[27%]" />
          <col className="w-[29%]" />
        </colgroup>
        <thead>
          <tr>
            <td className="border border-gray-400 px-1 py-0.5 font-bold bg-gray-100" colSpan={2}>
              D. Insurance contribution (BHXH, BHYT)
            </td>
            <td className="border border-gray-400 px-1 py-0.5 text-center font-italic text-gray-600 text-[13px]">
              (9% SI, 1.5% HI)
            </td>
            <td className="border border-gray-400 px-1 py-0.5 text-right font-bold">{employeeInsurance > 0 ? formatCurrency(employeeInsurance) + ' VND' : '- VND'}</td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-gray-400 px-1 py-0.5 w-8 text-center text-blue-600">6</td>
            <td className="border border-gray-400 px-1 py-0.5 text-blue-600">Kinh phí công đoàn</td>
            <td className="border border-gray-400 px-1 py-0.5 text-center text-blue-600">0.5%</td>
            <td className="border border-gray-400 px-1 py-0.5 text-right">{unionFee > 0 ? formatCurrency(unionFee) : '-'}</td>
          </tr>
          <tr>
            <td colSpan={4} className="py-2"></td>
          </tr>
        </tbody>
      </table>

      {/* E. Assessable income */}
      <table className="w-full mb-1 border-collapse">
        <colgroup>
          <col className="w-[6%]" />
          <col className="w-[38%]" />
          <col className="w-[27%]" />
          <col className="w-[29%]" />
        </colgroup>
        <tbody>
          <tr>
            <td className="border border-gray-400 px-1 py-0.5 font-bold bg-gray-100" colSpan={2}>
              E. Assessable income (Thu nhập tính thuế TNCN)
            </td>
            <td className="border border-gray-400 px-1 py-0.5 text-center font-italic text-gray-600 text-[13px]">
              (E)=(B)+(C)+(D)
            </td>
            <td className="border border-gray-400 px-1 py-0.5 text-right font-bold">{assessableIncome > 0 ? formatCurrency(assessableIncome) + ' VND' : '- VND'}</td>
          </tr>
          <tr>
            <td colSpan={4} className="py-2"></td>
          </tr>
        </tbody>
      </table>

      {/* F. Personal Income Tax */}
      <table className="w-full mb-1 border-collapse">
        <colgroup>
          <col className="w-[6%]" />
          <col className="w-[38%]" />
          <col className="w-[27%]" />
          <col className="w-[29%]" />
        </colgroup>
        <tbody>
          <tr>
            <td className="border border-gray-400 px-1 py-0.5 font-bold bg-gray-100" colSpan={2}>
              F. Personal Income Tax (Thuế TNCN)
            </td>
            <td className="border border-gray-400 px-1 py-0.5 text-center font-italic text-gray-600 text-[13px]">
              (F)=pit(E)
            </td>
            <td className="border border-gray-400 px-1 py-0.5 text-right font-bold">{personalIncomeTax > 0 ? formatCurrency(personalIncomeTax) + ' VND' : '- VND'}</td>
          </tr>
          <tr>
            <td colSpan={4} className="py-2"></td>
          </tr>
        </tbody>
      </table>

      {/* G. Trừ Adv */}
      <table className="w-full mb-1 border-collapse">
        <colgroup>
          <col className="w-[6%]" />
          <col className="w-[38%]" />
          <col className="w-[27%]" />
          <col className="w-[29%]" />
        </colgroup>
        <tbody>
          <tr>
            <td className="border border-gray-400 px-1 py-0.5 font-bold bg-gray-100" colSpan={2}>
              G. Trừ Adv
            </td>
            <td className="border border-gray-400 px-1 py-0.5 text-center">-</td>
            <td className="border border-gray-400 px-1 py-0.5 text-right font-bold">{advance > 0 ? formatCurrency(advance) + ' VND' : '- VND'}</td>
          </tr>
          <tr>
            <td colSpan={4} className="py-2"></td>
          </tr>
        </tbody>
      </table>

      {/* H. Total Net income */}
      <table className="w-full mb-1 border-collapse">
        <colgroup>
          <col className="w-[6%]" />
          <col className="w-[38%]" />
          <col className="w-[27%]" />
          <col className="w-[29%]" />
        </colgroup>
        <tbody>
          <tr>
            <td className="border border-gray-400 px-1 py-0.5 font-bold bg-gray-100" colSpan={2}>
              H. Total Net income (Tổng thu nhập sau thuế)
            </td>
            <td className="border border-gray-400 px-1 py-0.5 text-center font-italic text-gray-600 text-[13px]">
              (G)=(B)-(D)+(F)-(G)
            </td>
            <td className="border border-gray-400 px-1 py-0.5 text-right font-bold">{totalNetIncome > 0 ? formatCurrency(totalNetIncome) + ' VND' : '- VND'}</td>
          </tr>
          <tr>
            <td colSpan={4} className="py-2"></td>
          </tr>
        </tbody>
      </table>

      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-6xl font-bold text-gray-200 opacity-10 rotate-12 select-none">
          Page 1
        </div>
      </div>
    </div>
  );
});

PaySlip.displayName = 'PaySlip';
