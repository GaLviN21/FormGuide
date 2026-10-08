/**
 * FormGuide.AI — Interactive Frontend Controller
 */

// State Management
const state = {
  currentForm: null,
  activeTab: 'fields',
  searchQuery: '',
  filterCategory: 'all',
  checkedDocs: new Set(),
  checkedActions: new Set(),
  zoomLevel: 1.0,
  highlightsVisible: true
};

// Preset Sample Forms Database
const SAMPLE_FORMS = {
  scholarship: {
    id: 'scholarship',
    title: 'State Post-Matric Scholarship Application Form 2026',
    category: 'Education & Financial Aid',
    complexity: 'Medium',
    totalFields: 12,
    fields: [
      {
        id: 'f1',
        name: 'Full Name of Applicant',
        originalText: '1. Name of Applicant (in block letters as per SSC / Matric Certificate): _________________',
        type: 'Personal ID / Text',
        isMandatory: true,
        meaning: 'Enter your exact legal name in capital letters as it appears on your 10th class mark sheet or Aadhaar card. Do not use nicknames or initials unless they are officially printed on your certificate.',
        format: 'First Name + Middle Name + Last Name (ALL CAPS)',
        example: 'ROHIT KUMAR SHARMA',
        docRequired: 'SSC / 10th Class Passing Certificate',
        pitfalls: [
          'Name spelling must match your Aadhaar card character-for-character.',
          'Do not include prefixes like Mr., Ms., or Shri.'
        ]
      },
      {
        id: 'f2',
        name: 'Domicile Status & State Residency',
        originalText: '2. Domicile Status of Applicant/Parent: [ ] Permanent Resident [ ] Migrant Resident [ ] Others',
        type: 'State Residence Selection',
        isMandatory: true,
        meaning: 'This section verifies whether you or your parents are permanent legal residents of the state offering the scholarship. You must hold a valid state residence certificate.',
        format: 'Checkbox + State Domicile Certificate Number',
        example: 'Permanent Resident (Cert No: DOM/MH/2025/8892)',
        docRequired: 'State Domicile Certificate (Issued by Tehsildar/SDM)',
        pitfalls: [
          'Temporary rental agreements or hostel addresses do not qualify as permanent domicile.',
          'Certificate must be issued within the state boundaries.'
        ]
      },
      {
        id: 'f3',
        name: 'Annual Gross Family Income from All Sources',
        originalText: '3. Total Annual Income of Parents/Guardian from all sources: Rs. _________________',
        type: 'Currency / Financial',
        isMandatory: true,
        meaning: 'Enter the total combined yearly income earned by both your parents or legal guardians from salary, agriculture, business, or rent during the previous financial year.',
        format: 'Numeric Rupees (e.g. 1,50,000)',
        example: 'Rs. 1,80,000 / Year',
        docRequired: 'Income Certificate (Issued by Revenue Dept / Form 16)',
        pitfalls: [
          'For scholarship eligibility, income must be BELOW Rs. 2,50,000 per annum.',
          'Salary slips alone are not accepted; an official revenue income certificate is required.'
        ]
      },
      {
        id: 'f4',
        name: 'Aadhaar / Unique Identification Number (UID)',
        originalText: '4. Aadhaar Card No. of Applicant: ____-____-____ (Attach copy linked with Bank A/c)',
        type: 'Government ID',
        isMandatory: true,
        meaning: 'Provide your 12-digit national identity number. Your Aadhaar MUST be seeded/linked with your bank account to receive Direct Benefit Transfer (DBT) scholarship funds.',
        format: '12-digit number (xxxx-xxxx-xxxx)',
        example: '4589-1234-9876',
        docRequired: 'Aadhaar Card Copy',
        pitfalls: [
          'Ensure NPCI DBT status is ACTIVE on your Aadhaar bank account.',
          'Do not enter parent Aadhaar number in applicant field.'
        ]
      },
      {
        id: 'f5',
        name: 'Category & Caste Certificate Details',
        originalText: '5. Category: [ ] SC  [ ] ST  [ ] OBC  [ ] EWS  [ ] General | Sub-caste: ______________',
        type: 'Social Category Selection',
        isMandatory: true,
        meaning: 'Select your official social reservation category. If applying under SC/ST/OBC/EWS quota benefits, enter your caste certificate issuance details.',
        format: 'Category Box + Caste Cert Reference No.',
        example: 'OBC (Cert No: CC/2024/44321)',
        docRequired: 'Caste Certificate / EWS Certificate',
        pitfalls: [
          'OBC candidates must ensure their Non-Creamy Layer (NCL) status is valid for the current FY.'
        ]
      },
      {
        id: 'f6',
        name: 'Bank Account Number & IFSC Code',
        originalText: '6. Bank Name: __________ A/c No: __________________ IFSC: _______________',
        type: 'Bank Details',
        isMandatory: true,
        meaning: 'Enter your personal single savings bank account details where the scholarship money should be deposited. Joint accounts or cooperative bank accounts are usually rejected.',
        format: 'Core Banking Account No. + 11-character IFSC',
        example: 'A/c: 309812345678, IFSC: SBIN0001234',
        docRequired: 'Bank Passbook First Page Copy / Cancelled Cheque',
        pitfalls: [
          'Account must be in applicant\'s own name.',
          'Avoid zero-balance student accounts with small monthly transaction limits.'
        ]
      },
      {
        id: 'f7',
        name: 'Institutional Enrollment / Roll Number',
        originalText: '7. Current Course Name: _________ Year/Sem: _____ College Reg No: ____________',
        type: 'Academic Details',
        isMandatory: true,
        meaning: 'Provide your current ongoing degree/diploma course details along with your university registration or admission number.',
        format: 'Course Name + Registration ID',
        example: 'B.Tech Computer Science (Sem 3) - Reg No: 2024CS109',
        docRequired: 'College Bonafide Certificate & Fee Receipt',
        pitfalls: [
          'Course must be AICTE / UGC approved.'
        ]
      },
      {
        id: 'f8',
        name: 'Declaration of Applicant & Parent Signature',
        originalText: '8. Declaration: I hereby declare that statements made above are true... Date: _____ Sign: ______',
        type: 'Legal Signature & Consent',
        isMandatory: true,
        meaning: 'Legal affirmation confirming that all details provided are truthful. Falsifying income or domicile details leads to criminal prosecution and recovery of funds.',
        format: 'Date + Handwritten Signature',
        example: 'Signed on 15/10/2026 by Rohit Sharma & Parent',
        docRequired: 'Self-attested signature on physical form',
        pitfalls: [
          'Both student AND parent/guardian signatures are required.'
        ]
      }
    ],
    documents: [
      { id: 'd1', name: 'State Domicile Certificate', desc: 'Issued by Tehsildar / SDM proving state residency.', isMandatory: true },
      { id: 'd2', name: 'Income Certificate (Current FY)', desc: 'Revenue Dept income proof showing family income < 2.5 Lakhs.', isMandatory: true },
      { id: 'd3', name: 'Caste / Community Certificate', desc: 'Required if claiming SC/ST/OBC/EWS reservation.', isMandatory: true },
      { id: 'd4', name: 'Aadhaar-Linked Bank Passbook Copy', desc: 'First page showing A/c number, name, and IFSC code.', isMandatory: true }
    ],
    actions: [
      { id: 'a1', name: 'Get College Principal Stamp on Annexure A', desc: 'Verification signature by institutional head.' },
      { id: 'a2', name: 'Sign Declaration Section 8', desc: 'Handwritten signature of applicant & guardian.' }
    ],
    steps: [
      { num: 1, title: 'Gather Revenue Certificates', desc: 'Obtain updated Domicile Certificate and Income Certificate from local government e-Seva portal.' },
      { num: 2, title: 'Verify Aadhaar NPCI Seeding', desc: 'Visit your bank branch or check online to confirm your Aadhaar is linked with NPCI for DBT payments.' },
      { num: 3, title: 'Fill Personal & Academic Details', desc: 'Enter exact legal name matching SSC mark sheet and institution registration number.' },
      { num: 4, title: 'Attach Attested Document Copies', desc: 'Self-attest all photocopy attachments (Sign with date at bottom of each photocopy page).' },
      { num: 5, title: 'Submit Hardcopy to College Nodal Officer', desc: 'Submit completed form along with receipt acknowledgement before the cutoff date.' }
    ]
  },

  domicile: {
    id: 'domicile',
    title: 'Application for Grant of Domicile / Residence Certificate',
    category: 'Government & Legal Residency',
    complexity: 'Easy',
    totalFields: 8,
    fields: [
      {
        id: 'df1',
        name: 'Applicant Permanent Residential Address',
        originalText: '1. House No / Plot No / Village / Tehsil / District: ___________________________',
        type: 'Address Text',
        isMandatory: true,
        meaning: 'Full physical permanent home address where your family resides permanently in the state.',
        format: 'House No, Street, Village/City, Tehsil, Pin Code',
        example: 'H.No 45, Green Park, Taluka Haveli, Pune - 411001',
        docRequired: 'Ration Card / Electricity Bill / Property Tax Receipt',
        pitfalls: ['Address must match supporting utility bill exactly.']
      },
      {
        id: 'df2',
        name: 'Duration of Stay in State (Years)',
        originalText: '2. Period of continuous residence in the state: _____ Years _____ Months',
        type: 'Numerical Duration',
        isMandatory: true,
        meaning: 'Number of consecutive years you or your family have lived in this state continuously.',
        format: 'Number of Years (Minimum 10 or 15 years depending on state rules)',
        example: '18 Years',
        docRequired: 'School Leaving Certificates / Electoral Roll records',
        pitfalls: ['Most states require minimum 10 to 15 years continuous stay.']
      },
      {
        id: 'df3',
        name: 'Proof of Property Ownership / Land Record',
        originalText: '3. Property / Khata / Survey No. registered under applicant/parents: ____________',
        type: 'Land Record Reference',
        isMandatory: false,
        meaning: 'If your family owns land or house property in the state, enter the 7/12 extract or property tax account number.',
        format: 'Property Tax Account No. or Khata No.',
        example: 'Property A/c # 9081-B',
        docRequired: '7/12 Extract or Registered Sale Deed copy',
        pitfalls: ['Optional if living in ancestral house with voter ID proof.']
      }
    ],
    documents: [
      { id: 'dd1', name: 'Birth Certificate or SSC School Leaving Certificate', desc: 'Proof showing place of birth within state.', isMandatory: true },
      { id: 'dd2', name: 'Continuous Residence Proof (10+ Years)', desc: 'Electricity bills / School certificates / Ration card.', isMandatory: true },
      { id: 'dd3', name: 'Affidavit sworn before Executive Magistrate / Notary', desc: 'Stamp paper declaration of domicile intent.', isMandatory: true }
    ],
    actions: [
      { id: 'da1', name: 'Execute RS 100 Non-Judicial Stamp Paper Affidavit', desc: 'Sworn before Notary Public.' },
      { id: 'da2', name: 'Talathi / Revenue Circle Officer Inspection', desc: 'Local police or revenue officer site visit verification.' }
    ],
    steps: [
      { num: 1, title: 'Draft Residence Affidavit', desc: 'Prepare affidavit on Rs 100 stamp paper detailing period of residence.' },
      { num: 2, title: 'Attach Address & Birth Proofs', desc: 'Compile school leaving certificate, ration card, and voter ID.' },
      { num: 3, title: 'Submit at Citizen Service Center (MahaOnline / e-Seva)', desc: 'Submit application fee and receive Application Reference ID.' }
    ]
  },

  tax: {
    id: 'tax',
    title: 'Form 12BB — Investment & Deduction Declaration Form',
    category: 'Income Tax / Payroll',
    complexity: 'Medium',
    totalFields: 10,
    fields: [
      {
        id: 'tf1',
        name: 'House Rent Allowance (HRA) Claim',
        originalText: '1. Rent Paid to Landlord: Rs. __________ Landlord PAN (if rent > Rs 1 Lakh): ____________',
        type: 'Tax Exemption / HRA',
        isMandatory: false,
        meaning: 'Declare total annual house rent paid to your landlord to claim HRA tax exemption under Section 10(13A).',
        format: 'Rent Amount + Landlord Name & PAN',
        example: 'Rs 1,44,000 / Year (Landlord PAN: ABCDE1234F)',
        docRequired: 'Rent Agreement Copy + Rent Receipts + Landlord PAN Copy',
        pitfalls: ['Landlord PAN is MANDATORY if total rent paid exceeds Rs 1,00,000 in FY.']
      },
      {
        id: 'tf2',
        name: 'Section 80C Investments (PPF, ELSS, EPF, LIC)',
        originalText: '2. Deduction under 80C: Total Rs. ____________ (Max limit Rs 1,50,000)',
        type: 'Financial Deduction',
        isMandatory: false,
        meaning: 'Declare payments made towards Provident Fund, Public Provident Fund (PPF), Equity Linked Savings Schemes (ELSS), Life Insurance Premiums, or Home Loan Principal repayment.',
        format: 'Total Amount in INR (Cap Rs 1,50,000)',
        example: 'Rs 1,50,000',
        docRequired: 'Premium receipts, ELSS statement, PPF passbook copy',
        pitfalls: ['Receipt dates must fall strictly between April 1 and March 31 of current FY.']
      },
      {
        id: 'tf3',
        name: 'Section 80D Health Insurance Premium',
        originalText: '3. Mediclaim Premium Paid: Self/Family: Rs. ________ Parents (Senior Citizen): Rs. ________',
        type: 'Medical Deduction',
        isMandatory: false,
        meaning: 'Declare health insurance premium paid for self, spouse, children, or senior citizen parents.',
        format: 'Amount in INR',
        example: 'Self: Rs 25,000, Parents: Rs 50,000',
        docRequired: '80D Tax Certificate issued by Insurance Company',
        pitfalls: ['Cash payments are NOT eligible for 80D deduction; payment must be made via bank/online/cheque.']
      }
    ],
    documents: [
      { id: 'td1', name: 'Rent Receipts & Lease Agreement', desc: 'Showing monthly rent paid and landlord signature.', isMandatory: false },
      { id: 'td2', name: '80C Investment Proofs', desc: 'LIC receipts, Mutual Fund ELSS statements, PPF passbook.', isMandatory: false },
      { id: 'td3', name: 'Health Insurance 80D Tax Statement', desc: 'Certificate showing non-cash premium payment.', isMandatory: false }
    ],
    actions: [
      { id: 'ta1', name: 'Submit Online on HR Payroll Portal', desc: 'Upload proof PDFs before corporate deadline.' }
    ],
    steps: [
      { num: 1, title: 'Calculate Total 80C & 80D Investments', desc: 'Sum up all LIC premiums, EPF, PPF, and ELSS payments.' },
      { num: 2, title: 'Obtain Landlord PAN Copy if Rent > 1L', desc: 'Ensure landlord PAN is verified on Income Tax e-filing portal.' },
      { num: 3, title: 'Submit Form 12BB Declaration to Employer', desc: 'Sign and submit declaration before January deadline.' }
    ]
  }
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initDropzone();
});

// Drag & Drop Setup
function initDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');

  if (!dropzone || !fileInput) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  });
}

// File Upload Handler
async function handleFileUpload(file) {
  showToast(`Uploaded ${file.name}`);
  showLoadingScreen();

  try {
    const formData = new FormData();
    formData.append('file', file);

    const uploadRes = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (uploadRes.ok) {
      const uploadData = await uploadRes.json();
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: uploadData.session_id })
      });
      
      if (analyzeRes.ok) {
        const result = await analyzeRes.json();
        renderWorkspace(result.form_data);
        return;
      }
    }
  } catch (err) {
    console.log('Server API not reachable, running client-side simulation...');
  }

  // Fallback / Simulation for testing
  setTimeout(() => {
    document.getElementById('step-1').className = 'step-item done';
    document.getElementById('step-2').className = 'step-item active';
    document.getElementById('loading-bar').style.width = '50%';
  }, 700);

  setTimeout(() => {
    document.getElementById('step-2').className = 'step-item done';
    document.getElementById('step-3').className = 'step-item active';
    document.getElementById('loading-bar').style.width = '80%';
  }, 1400);

  setTimeout(() => {
    document.getElementById('step-3').className = 'step-item done';
    document.getElementById('step-4').className = 'step-item done';
    document.getElementById('loading-bar').style.width = '100%';

    renderWorkspace(SAMPLE_FORMS.scholarship);
  }, 2100);
}

// Preset Loader
function loadSampleForm(presetKey) {
  const form = SAMPLE_FORMS[presetKey];
  if (!form) return;

  showLoadingScreen();
  
  setTimeout(() => {
    renderWorkspace(form);
  }, 800);
}

// View Controller Transitions
function showLoadingScreen() {
  document.getElementById('upload-screen').classList.add('hidden');
  document.getElementById('workspace-screen').classList.add('hidden');
  
  const loadingScreen = document.getElementById('loading-screen');
  loadingScreen.classList.remove('hidden');

  document.getElementById('loading-bar').style.width = '20%';
  document.getElementById('step-1').className = 'step-item active';
  document.getElementById('step-2').className = 'step-item pending';
  document.getElementById('step-3').className = 'step-item pending';
  document.getElementById('step-4').className = 'step-item pending';
}

function showUploadScreen() {
  document.getElementById('workspace-screen').classList.add('hidden');
  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('upload-screen').classList.remove('hidden');
}

// Workspace Renderer
function renderWorkspace(formData) {
  state.currentForm = formData;
  state.checkedDocs.clear();
  state.checkedActions.clear();

  document.getElementById('loading-screen').classList.add('hidden');
  document.getElementById('workspace-screen').classList.remove('hidden');

  // Header Titles
  document.getElementById('form-main-title').textContent = formData.title;
  document.getElementById('form-category-badge').textContent = formData.category;
  document.getElementById('form-complexity-pill').textContent = formData.complexity;

  // Counts
  document.getElementById('count-fields').textContent = formData.fields.length;
  document.getElementById('count-docs').textContent = formData.documents.length;
  document.getElementById('count-steps').textContent = formData.steps.length;

  // Render Document Sheet Image Canvas
  renderDocumentSheet(formData);

  // Render Tabs Panes
  renderFieldsList(formData.fields);
  renderDocumentChecklist(formData.documents, formData.actions);
  renderWizardSteps(formData.steps);

  switchTab('fields');
}

// Document Canvas Sheet Renderer
function renderDocumentSheet(formData) {
  const sheet = document.getElementById('document-sheet');
  sheet.innerHTML = `
    <div class="doc-sheet-header">
      <h3>${formData.title}</h3>
      <p>Official Form Document Preview • ${formData.category}</p>
    </div>
  `;

  formData.fields.forEach((field, index) => {
    const fieldEl = document.createElement('div');
    fieldEl.className = 'doc-sheet-field';
    fieldEl.id = `sheet-field-${field.id}`;
    fieldEl.innerHTML = `
      <span class="field-num-tag">Field ${index + 1}</span>
      <span class="doc-sheet-label">${field.name} ${field.isMandatory ? '*' : ''}</span>
      <div class="doc-sheet-box"></div>
    `;

    fieldEl.addEventListener('click', () => {
      switchTab('fields');
      expandFieldAccordion(field.id);
    });

    sheet.appendChild(fieldEl);
  });
}

// Field Explorer Renderer
function renderFieldsList(fields) {
  const container = document.getElementById('fields-list-container');
  container.innerHTML = '';

  const query = state.searchQuery.toLowerCase();
  const filter = state.filterCategory;

  const filtered = fields.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(query) || 
                          f.meaning.toLowerCase().includes(query) ||
                          f.originalText.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    if (filter === 'mandatory') return f.isMandatory;
    if (filter === 'has-doc') return !!f.docRequired;
    return true;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 2rem;">No fields match your search filter.</div>`;
    return;
  }

  filtered.forEach((f, idx) => {
    const card = document.createElement('div');
    card.className = 'field-card';
    card.id = `accordion-card-${f.id}`;
    
    card.innerHTML = `
      <div class="field-header" onclick="toggleAccordion('${f.id}')">
        <div class="field-header-left">
          <span class="field-index">${idx + 1}</span>
          <div class="field-title-block">
            <h4>${f.name}</h4>
            <span class="field-type-tag">${f.type}</span>
          </div>
        </div>

        <div class="field-header-right">
          ${f.isMandatory ? '<span class="req-badge mandatory">Required</span>' : '<span class="req-badge optional">Optional</span>'}
          ${f.docRequired ? '<span class="doc-req-pill">📎 Needs Doc</span>' : ''}
          <svg class="chevron-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
      </div>

      <div class="field-body">
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem; font-family: monospace;">
          Original Form Wording: ${f.originalText}
        </div>

        <div class="explanation-box">
          <div class="exp-label">💡 What does this mean?</div>
          <div class="exp-text">${f.meaning}</div>
        </div>

        <div class="field-meta-grid">
          <div class="meta-item">
            <div class="meta-title">Expected Format</div>
            <div class="meta-val">${f.format}</div>
          </div>
          <div class="meta-item">
            <div class="meta-title">Example Entry</div>
            <div class="meta-val">${f.example}</div>
          </div>
        </div>

        ${f.docRequired ? `
          <div class="attachment-alert-box">
            <span>📎</span>
            <div><strong>Required Supporting Document:</strong> ${f.docRequired}</div>
          </div>
        ` : ''}

        ${f.pitfalls && f.pitfalls.length > 0 ? `
          <div class="pitfalls-box">
            <div class="pitfalls-title">⚠️ Common Mistakes to Avoid:</div>
            <ul class="pitfalls-list">
              ${f.pitfalls.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;

    container.appendChild(card);
  });
}

function toggleAccordion(fieldId) {
  const card = document.getElementById(`accordion-card-${fieldId}`);
  if (!card) return;

  const isExpanded = card.classList.contains('expanded');
  
  document.querySelectorAll('.field-card').forEach(c => c.classList.remove('expanded'));
  
  if (!isExpanded) {
    card.classList.add('expanded');
    highlightDocumentSheetField(fieldId);
  } else {
    unhighlightDocumentSheetFields();
  }
}

function expandFieldAccordion(fieldId) {
  toggleAccordion(fieldId);
  const card = document.getElementById(`accordion-card-${fieldId}`);
  if (card) {
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function highlightDocumentSheetField(fieldId) {
  if (!state.highlightsVisible) return;
  unhighlightDocumentSheetFields();
  const sheetField = document.getElementById(`sheet-field-${fieldId}`);
  if (sheetField) {
    sheetField.classList.add('selected');
    sheetField.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function unhighlightDocumentSheetFields() {
  document.querySelectorAll('.doc-sheet-field').forEach(el => el.classList.remove('selected'));
}

function toggleHighlights() {
  state.highlightsVisible = !state.highlightsVisible;
  const btn = document.getElementById('toggle-highlights-btn');
  if (state.highlightsVisible) {
    btn.classList.add('active');
    showToast('Field highlights enabled');
  } else {
    btn.classList.remove('active');
    unhighlightDocumentSheetFields();
    showToast('Field highlights hidden');
  }
}

// Search & Filtering
function filterFields() {
  state.searchQuery = document.getElementById('field-search-input').value;
  if (state.currentForm) {
    renderFieldsList(state.currentForm.fields);
  }
}

function setFieldFilter(filter, el) {
  state.filterCategory = filter;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  if (state.currentForm) {
    renderFieldsList(state.currentForm.fields);
  }
}

// Pane 2: Document Checklist Renderer
function renderDocumentChecklist(docs, actions) {
  const docsContainer = document.getElementById('docs-checklist-container');
  const actionsContainer = document.getElementById('actions-checklist-container');

  docsContainer.innerHTML = '';
  actionsContainer.innerHTML = '';

  docs.forEach(doc => {
    const isChecked = state.checkedDocs.has(doc.id);
    const item = document.createElement('div');
    item.className = `checklist-item ${isChecked ? 'checked' : ''}`;
    item.innerHTML = `
      <div class="chk-box">${isChecked ? '✓' : ''}</div>
      <div class="chk-info">
        <h5>${doc.name} ${doc.isMandatory ? '<span style="color: var(--accent-danger); font-size: 0.7rem;">(Mandatory)</span>' : ''}</h5>
        <p>${doc.desc}</p>
      </div>
    `;

    item.addEventListener('click', () => {
      if (state.checkedDocs.has(doc.id)) {
        state.checkedDocs.delete(doc.id);
      } else {
        state.checkedDocs.add(doc.id);
      }
      renderDocumentChecklist(docs, actions);
      updateReadinessCounter();
    });

    docsContainer.appendChild(item);
  });

  actions.forEach(act => {
    const isChecked = state.checkedActions.has(act.id);
    const item = document.createElement('div');
    item.className = `checklist-item ${isChecked ? 'checked' : ''}`;
    item.innerHTML = `
      <div class="chk-box">${isChecked ? '✓' : ''}</div>
      <div class="chk-info">
        <h5>${act.name}</h5>
        <p>${act.desc}</p>
      </div>
    `;

    item.addEventListener('click', () => {
      if (state.checkedActions.has(act.id)) {
        state.checkedActions.delete(act.id);
      } else {
        state.checkedActions.add(act.id);
      }
      renderDocumentChecklist(docs, actions);
      updateReadinessCounter();
    });

    actionsContainer.appendChild(item);
  });

  updateReadinessCounter();
}

function updateReadinessCounter() {
  if (!state.currentForm) return;
  const total = state.currentForm.documents.length;
  const count = state.checkedDocs.size;
  const pct = Math.round((count / total) * 100);

  document.getElementById('readiness-text').textContent = `${count} of ${total} Ready`;
  document.getElementById('readiness-bar').style.width = `${pct}%`;
}

function resetChecklist() {
  state.checkedDocs.clear();
  state.checkedActions.clear();
  if (state.currentForm) {
    renderDocumentChecklist(state.currentForm.documents, state.currentForm.actions);
  }
  showToast('Checklist reset');
}

// Export Checklist
function exportChecklist() {
  if (!state.currentForm) return;

  const lines = [
    `FORMGUIDE AI — REQUIREMENT CHECKLIST`,
    `Form: ${state.currentForm.title}`,
    `Category: ${state.currentForm.category}`,
    `Date Generated: ${new Date().toLocaleDateString()}`,
    `--------------------------------------------------`,
    `\n📎 SUPPORTING DOCUMENTS REQUIRED:`
  ];

  state.currentForm.documents.forEach((d, i) => {
    const isReady = state.checkedDocs.has(d.id) ? '[X]' : '[ ]';
    lines.push(`${isReady} ${i + 1}. ${d.name} (${d.desc})`);
  });

  lines.push(`\n✍️ REQUIRED ACTIONS:`);
  state.currentForm.actions.forEach((a, i) => {
    const isDone = state.checkedActions.has(a.id) ? '[X]' : '[ ]';
    lines.push(`${isDone} ${i + 1}. ${a.name} (${a.desc})`);
  });

  lines.push(`\n🧭 STEP-BY-STEP COMPLETION SEQUENCE:`);
  state.currentForm.steps.forEach(s => {
    lines.push(`Step ${s.num}: ${s.title} — ${s.desc}`);
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.currentForm.id}_Checklist.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Checklist exported to text file!');
}

// Pane 3: Wizard Steps Renderer
function renderWizardSteps(steps) {
  const container = document.getElementById('wizard-steps-container');
  container.innerHTML = '';

  steps.forEach(s => {
    const node = document.createElement('div');
    node.className = 'wizard-step-node';
    node.innerHTML = `
      <div class="step-marker">${s.num}</div>
      <div class="step-header">
        <h5>Step ${s.num}: ${s.title}</h5>
        <p class="step-desc">${s.desc}</p>
      </div>
    `;
    container.appendChild(node);
  });
}

// Zoom & View Controls
function zoomDoc(delta) {
  state.zoomLevel = Math.max(0.5, Math.min(2.0, state.zoomLevel + delta));
  const container = document.getElementById('canvas-container');
  container.style.transform = `scale(${state.zoomLevel})`;
  document.getElementById('zoom-text').textContent = `${Math.round(state.zoomLevel * 100)}%`;
}

function resetZoom() {
  state.zoomLevel = 1.0;
  const container = document.getElementById('canvas-container');
  container.style.transform = `scale(1)`;
  document.getElementById('zoom-text').textContent = `100%`;
}

// Tab Switching
function switchTab(tabId) {
  state.activeTab = tabId;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  document.querySelectorAll('.tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `pane-${tabId}`);
  });
}

// Helper Utilities
function showToast(msg) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}
