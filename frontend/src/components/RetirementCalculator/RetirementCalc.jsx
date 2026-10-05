import React, { useMemo, useState } from "react";
import "./RetirementCalculator.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const STEPS = [
  "FUTURE EXPENSE",
  "RETIREMENT CORPUS",
  "INVEST PER MONTH",
  "YOUR SUMMARY",
];

export default function RetirementCalculator() {
  const [step, setStep] = useState(0);

  /* Core Inputs */
  const [age, setAge] = useState(25);
  const [retireAge, setRetireAge] = useState(60);
  const [lifeExpectancy, setLifeExpectancy] = useState(85);
  const [inflation, setInflation] = useState(6);
  const [monthlyExpense, setMonthlyExpense] = useState(40000);
  const [preReturn, setPreReturn] = useState(11);
  const [postReturn, setPostReturn] = useState(7);
  const [equity, setEquity] = useState(70);
  const [postLifeYears, setPostLifeYears] = useState("");
const [postReturnRate, setPostReturnRate] = useState("");
const [lifeError, setLifeError] = useState(false);
const [lumpSum, setLumpSum] = useState("");
const [accumulationRate, setAccumulationRate] = useState("");
const [userName] = useState("testing");

const handlePrint = () => {
  window.print();
};

const handleDownloadPDF = async () => {
  const element = document.querySelector(".summary-print");


  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
  pdf.save("Retirement-Summary.pdf");
};


  /* Derived Values */
  const yearsToRetire = retireAge - age;
  const retirementYears = lifeExpectancy - retireAge;

  /* Step 1 */
  const futureMonthlyExpense = useMemo(() => {
    return Math.round(
      monthlyExpense * Math.pow(1 + inflation / 100, yearsToRetire)
    );
  }, [monthlyExpense, inflation, yearsToRetire]);

  /* Step 2 */
  const retirementCorpus = useMemo(() => {
  if (!postLifeYears || !postReturnRate) return 0;

  const monthlyRate = postReturnRate / 100 / 12;
  const months = postLifeYears * 12;

  return Math.round(
    (futureMonthlyExpense * (1 - Math.pow(1 + monthlyRate, -months))) /
      monthlyRate
  );
}, [futureMonthlyExpense, postLifeYears, postReturnRate]);


  /* Step 3 */
 const monthlySIP = useMemo(() => {
  if (!accumulationRate) return 0;

  const r = accumulationRate / 100 / 12;
  const n = yearsToRetire * 12;

  const corpusAfterLumpSum = lumpSum
    ? retirementCorpus - lumpSum * Math.pow(1 + r, n)
    : retirementCorpus;

  if (corpusAfterLumpSum <= 0) return 0;

  return Math.round(
    (corpusAfterLumpSum * r) / (Math.pow(1 + r, n) - 1)
  );
}, [retirementCorpus, accumulationRate, yearsToRetire, lumpSum]);


  return (
    <div className="ret-wrapper">
      <h1 className="main-title">RETIREMENT FUND CALCULATOR</h1>

      {/* Step Navigation */}
      <div className="steps">
        {STEPS.map((label, i) => (
          <div
            key={i}
            className={`step ${step === i ? "active" : ""}`}
            onClick={() => setStep(i)}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="content-custom">
        {/* STEP 1 */}
        {step === 0 && (
          <>
            <SectionTitle>Future Value of Expenses</SectionTitle>

            <FormRow label="Current Age">
              <Input value={age} set={setAge} unit="Years" />
            </FormRow>

            <FormRow label="Retirement Age">
              <Input value={retireAge} set={setRetireAge} unit="Years" />
            </FormRow>

            <FormRow label="Inflation Rate">
              <Input value={inflation} set={setInflation} unit="%" />
            </FormRow>

            <FormRow label="Current Monthly Expense">
              <Input value={monthlyExpense} set={setMonthlyExpense} unit="₹" />
            </FormRow>

            <ResultBox>
              Future Monthly Expense
              <strong>₹ {futureMonthlyExpense.toLocaleString()}</strong>
            </ResultBox>
            <br/>
            <p><strong>Notice :-</strong> how your future expenses are substantially higher, due to the effect of inflation. You have to save prudently to beat inflation and accumulate a sufficient retirement corpus to ensure that your future cost of living is comfortably met.</p>
            
            <hr/>
            <p><strong>Calculation Methodology: </strong>The above calculation is based on monthly compounding of the inflation rate you have assumed. For example, if you have assumed 6% inflation rate, 0.5% (6% divided by 12) monthly compounded rate is used for the time period between your present age and retirement.</p>
          </>
        )}

       {/* STEP 2 – RETIREMENT CORPUS (EXACT AMC STYLE) */}
{step === 1 && (
  <>
    <SectionTitle>Retirement Corpus Required</SectionTitle>

    {/* Annuity per month */}
    <FormRow label="Annuity per month">
      <div className="input-box disabled">
        <span>Rs.</span>
        <input value={futureMonthlyExpense} disabled />
      </div>
    </FormRow>

    {/* Life Expectancy */}
    <FormRow label="Life Expectancy (Number of years post retirement)">
      <div>
        <div className="input-box">
          <span>Years</span>
          <input
            type="number"
            value={postLifeYears}
            onChange={(e) => {
              setPostLifeYears(e.target.value);
              setLifeError(false);
            }}
          />
        </div>

        {lifeError && (
          <div className="error-text">
            Please enter life expectancy value
          </div>
        )}
      </div>
    </FormRow>

    {/* Post Retirement Return */}
    <FormRow label="Assumed Rate of Returns Post-Retirement">
      <select
  className="select-box"
  value={postReturnRate}
  onChange={(e) => setPostReturnRate(e.target.value)}
>
  <option value="">Select rate</option>
  {Array.from({ length: 25 }, (_, i) => i + 1).map(rate => (
    <option key={rate} value={rate}>
      {rate}%
    </option>
  ))}
</select>

    </FormRow>

    {/* Result */}
    {retirementCorpus > 0 && (
  <>
    <ResultBox>
      Retirement Corpus Required
      <strong>₹ {retirementCorpus.toLocaleString()}</strong>
    </ResultBox>
    <br/>
    <p className="corpus-note">
      You have to make sure to have a minimum retirement corpus of
      <strong> ₹ {retirementCorpus.toLocaleString()}</strong> to meet your
      post-retirement regular expenses based on your assumptions. You may also
      like to consider building a higher retirement corpus to take care of
      emergency expenses.
    </p>
  </>
)}

<hr/>
{/* Methodology */}
    <p className="methodology">
      <strong>Calculation Methodology:</strong> The above calculation is based on
      the assumption that monthly withdrawal is made on the retirement corpus at
      monthly compounding of the annual rate of return you have entered over the
      period of your life expectancy. The retirement corpus will be fully
      exhausted at the end of life expectancy.
    </p>
    
  </>
)}


        {/* STEP 3 – INVEST PER MONTH (EXACT AMC STYLE) */}
{step === 2 && (
  <>
    <SectionTitle>Monthly Investment Required</SectionTitle>

    {/* Retirement Corpus */}
    <FormRow label="Retirement Corpus">
      <div className="input-box disabled">
        <span>Rs.</span>
        <input value={retirementCorpus} disabled />
      </div>
    </FormRow>

    {/* Years left */}
    <FormRow label="Number of Years left for Retirement">
      <div className="input-box disabled">
        <span>Years</span>
        <input value={yearsToRetire} disabled />
      </div>
    </FormRow>

    {/* Lump sum */}
    <FormRow label="How much would you invest right now as a lumpsum towards your retirement goal">
      <div className="input-box">
        <span>Rs.</span>
        <input
          type="number"
          value={lumpSum}
          onChange={(e) => setLumpSum(+e.target.value)}
        />
      </div>
    </FormRow>

    {/* Accumulation return */}
    <FormRow label="Assumed Rate of Returns During Accumulation">
      <select
        className="select-box"
        value={accumulationRate}
        onChange={(e) => setAccumulationRate(e.target.value)}
      >
        <option value="">Select rate</option>
        {Array.from({ length: 25 }, (_, i) => i + 1).map(rate => (
          <option key={rate} value={rate}>
            {rate}%
          </option>
        ))}
      </select>
    </FormRow>

    {/* Result */}
    {monthlySIP > 0 && (
      <ResultBox>
        Monthly Investment Required
        <strong>₹ {monthlySIP.toLocaleString()}</strong>
      </ResultBox>
    )}

    <hr />

    {/* Methodology */}
    <p className="methodology">
      <strong>Calculation Methodology:</strong> The above calculation is based on
      monthly compounding of the rate of return you have entered, over the number
      of years left for your retirement for the required retirement corpus. For
      example, if you have entered 15% rate of return for 30 years, the calculator
      uses 1.25% (15% divided by 12) for 360 months (30 years multiplied by 12) to
      calculate the amount you need to save per month to accumulate your desired
      retirement corpus.
    </p>
  </>
)}


        {/* STEP 5 */}
        {/* STEP 5 – SUMMARY (AMC STYLE) */}
{step === 3 && (
  <>
    {/* Action Icons */}
   <div className="summary-actions">
  {/* <button onClick={handlePrint}>🖨 Print</button>
  <button onClick={handleDownloadPDF}>📄 PDF</button> */}
</div>

    {/* Intro Text */}
    <p className="summary-intro">
      {/* <span className="highlight">Dear {userName},</span><br /> */}
      Based on your inputs and assumptions, you have{" "}
      <b>{yearsToRetire} years</b> to retire. You need to invest{" "}
      <b>Rs. {lumpSum?.toLocaleString() || 0}</b> as lumpsum and{" "}
      <b>Rs. {monthlySIP.toLocaleString()}</b> per month possible retirement
      corpus <b>Rs. {retirementCorpus.toLocaleString()}</b>, which could provide
      you a cash flow of <b>Rs. {futureMonthlyExpense.toLocaleString()}</b> per
      month.
    </p>

    {/* Summary Cards */}
    <div className="summary-cards">
      <div className="summary-card primary">
        <p>Present age: <b>{age}</b></p>
        <p>Age of retirement: <b>{retireAge}</b></p>
        <p>
          Monthly withdrawal post-retirement:{" "}
          <b>Rs. {futureMonthlyExpense.toLocaleString()}</b>
        </p>
        <p>
          Possible Retirement corpus:{" "}
          <b>Rs. {retirementCorpus.toLocaleString()}</b>
        </p>
      </div>

      <div className="summary-card secondary">
        <p>
          Lumpsum amount to be invested today:{" "}
          <b>Rs. {lumpSum?.toLocaleString() || 0}</b>
        </p>
        <p>
          Amount to invest per month:{" "}
          <b>Rs. {monthlySIP.toLocaleString()}</b>
        </p>
      </div>
    </div>

   
    <hr />

    {/* Disclaimer */}
    <p className="disclaimer">
      <strong>Disclaimer:</strong> This calculator is provided to enable you to
      plan your retirement and aid an estimate for the retirement benefit. It is
      designed only for information / education purpose. The results presented
      by this calculator are hypothetical and based on the information / inputs
      provided by you. Kindly do not consider this as an investment advice or
      solicitation. Please consult your financial advisor before making any
      investment decisions.
    </p>
  </>
)}


        {/* Navigation Buttons */}
        <div className="nav">
          {step > 0 && (
            <button className="btn-secondary" onClick={() => setStep(step - 1)}>
              ← Back
            </button>
          )}
          {step < 4 && (
            <button className="btn-primary" onClick={() => setStep(step + 1)}>
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Reusable UI Components ---------- */

const FormRow = ({ label, children }) => (
  <div className="form-row">
    <label>{label}</label>
    {children}
  </div>
);

const Input = ({ value, set, unit }) => (
  <div className="input-box">
    <span>{unit}</span>
    <input
      type="number"
      value={value}
      onChange={(e) => set(+e.target.value)}
    />
  </div>
);

const ResultBox = ({ children }) => (
  <div className="result-box">{children}</div>
);

const SectionTitle = ({ children }) => (
  <h2 className="section-title">{children}</h2>
);
