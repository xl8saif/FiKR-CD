import { 
  validateContributionInput, 
  submitIKContribution, 
  CONFIRMED_SPECIAL_GLYPHS, 
  CONFIRMED_EXEMPLAR_WORDS 
} from '../src/services/intakeService';
import { Contribution, ContributionType } from '../src/types';

// Mock localStorage for node environment if not present
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (k: string) => store[k] || null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

async function runBall155Tests() {
  console.log('====================================================');
  console.log('🧪 RUNNING BALL 15.5: IK CONTRIBUTION INTAKE TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
      failed++;
    }
  }

  // --- Test 1: IK + Urdu provided (Valid) ---
  const t1 = validateContributionInput({
    ikText: 'ڇھگور',
    urduMeaning: 'سیب (چھوٹا جنگلی سیب)',
    category: 'word',
    dialect: 'patan',
    source: 'Native Speaker Everyday Speech',
    consentId: 'consent_123',
    license: 'Public Cultural Preservation'
  });
  assert(t1.isValid && Object.keys(t1.errors).length === 0, 'Test 1: Valid submission with IK + Urdu');

  // --- Test 2: IK + English provided (Valid) ---
  const t2 = validateContributionInput({
    ikText: 'څھیر',
    englishMeaning: 'Milk (Fresh cow or goat milk)',
    category: 'word',
    dialect: 'jalkot',
    source: 'Elder Interview',
    consentId: 'consent_123',
    license: 'Public Cultural Preservation'
  });
  assert(t2.isValid && Object.keys(t2.errors).length === 0, 'Test 2: Valid submission with IK + English');

  // --- Test 3: IK + Urdu + English provided (Valid) ---
  const t3 = validateContributionInput({
    ikText: 'ݜاری',
    urduMeaning: 'صبح کی ٹھنڈی ہوا',
    englishMeaning: 'Morning mountain breeze',
    category: 'word',
    dialect: 'palas',
    source: 'Fieldwork / Linguistic Documentation',
    consentId: 'consent_123',
    license: 'CC BY-NC 4.0'
  });
  assert(t3.isValid && Object.keys(t3.errors).length === 0, 'Test 3: Valid submission with IK + Urdu + English');

  // --- Test 4: Rejection when neither Urdu nor English is provided (CORE RULE) ---
  const t4 = validateContributionInput({
    ikText: 'ڙگو',
    category: 'word',
    dialect: 'seo',
    source: 'Oral Tradition / Ancestral Memory',
    consentId: 'consent_123',
    license: 'Public Cultural Preservation'
  });
  assert(!t4.isValid && Boolean(t4.errors.meaning), 'Test 4: Rejection when neither Urdu nor English is supplied');

  // --- Test 5: Rejection when IK text is empty ---
  const t5 = validateContributionInput({
    ikText: '   ',
    urduMeaning: 'کچھ بھی نہیں',
    category: 'word',
    dialect: 'duber',
    source: 'Native Speaker Everyday Speech',
    consentId: 'consent_123',
    license: 'Public Cultural Preservation'
  });
  assert(!t5.isValid && Boolean(t5.errors.ikText), 'Test 5: Rejection when IK text is missing/empty');

  // --- Test 6: Verbatim preservation of special Unicode glyphs (ڇ, څ, ݜ, ڙ, ݨ) ---
  const testGlyphs = ['ڇ', 'څ', 'ݜ', 'ڙ', 'ݨ'];
  const allGlyphsPresent = testGlyphs.every(g => CONFIRMED_SPECIAL_GLYPHS.includes(g as any));
  assert(allGlyphsPresent, 'Test 6: All 5 confirmed Unicode special glyphs registered');

  // --- Test 7: Exemplar words verbatim check ---
  const exemplars = ['ڇھگور', 'څھیر', 'ݜاری', 'ڙگو', 'کاݨ'];
  const allExemplarsMatch = exemplars.every(w => CONFIRMED_EXEMPLAR_WORDS.includes(w as any));
  assert(allExemplarsMatch, 'Test 7: All 5 authentic exemplar words registered verbatim');

  // --- Test 8: All 6 contribution categories accepted ---
  const categories: ContributionType[] = ['word', 'sentence', 'proverb', 'idiom', 'cultural_expression', 'poetry'];
  const catTests = categories.every(cat => {
    const res = validateContributionInput({
      ikText: 'مثالی جملہ',
      urduMeaning: 'مثالی معنی',
      category: cat,
      dialect: 'patan',
      source: 'Native Speaker Everyday Speech',
      consentId: 'consent_123',
      license: 'Public Cultural Preservation'
    });
    return res.isValid;
  });
  assert(catTests, 'Test 8: All 6 supported contribution types validated (Word, Sentence, Proverb, Idiom, Cultural Expression, Poetry)');

  // --- Test 9: Required dialects supported ---
  const dialects = ['patan', 'jalkot', 'palas', 'seo', 'jijal', 'duber', 'manikhel', 'rajkoti', 'kolai'];
  const dialectTests = dialects.every(d => {
    const res = validateContributionInput({
      ikText: 'کاݨ',
      englishMeaning: 'Ear / Body part',
      category: 'word',
      dialect: d,
      source: 'Native Speaker Everyday Speech',
      consentId: 'consent_123',
      license: 'Public Cultural Preservation'
    });
    return res.isValid;
  });
  assert(dialectTests, 'Test 9: All core Indus-Kohistani dialects supported (Patan, Jalkot, Palas, Seo, Jijal, Duber, Manikhel, Rajkoti, Kolai)');

  // --- Test 10: Duplicate check returns warning without blocking submission ---
  const existingMock: Contribution[] = [{
    id: 'existing-1',
    isDemoData: false,
    type: 'word',
    raw: {
      ikText: 'ڇھگور',
      urduMeaning: 'سیب',
      category: 'word',
      type: 'word',
      dialect: 'patan',
      source: 'Elder Interview',
      contributorId: 'user_1',
      contributorName: 'Ali',
      submittedAt: new Date().toISOString()
    }
  }];
  const dupCheck = validateContributionInput({
    ikText: 'ڇھگور',
    urduMeaning: 'سیب کی قسم',
    category: 'word',
    dialect: 'patan',
    source: 'Elder Interview',
    consentId: 'consent_123',
    license: 'Public Cultural Preservation'
  }, existingMock);
  assert(dupCheck.isValid && Boolean(dupCheck.warning && dupCheck.warning.includes('Similar entry already exists')), 'Test 10: Duplicate IK entry generates non-blocking warning');

  // --- Test 11: Submission creates record in RAW layer with status submitted_raw ---
  const submissionRes = await submitIKContribution({
    ikText: 'کاݨ',
    urduMeaning: 'کان (جسم کا عضو)',
    category: 'word',
    dialect: 'patan',
    source: 'Native Speaker Everyday Speech',
    contributorId: 'contributor_test_uid',
    contributorName: 'Test Contributor',
    consentId: 'consent_test_001',
    license: 'Public Cultural Preservation'
  }, { isOfflineMock: true });

  assert(
    submissionRes.contribution.raw.layer === 'RAW' &&
    submissionRes.contribution.raw.status === 'submitted_raw' &&
    submissionRes.contribution.raw.ikText === 'کاݨ',
    'Test 11: Submission stored in RAW layer with status submitted_raw and verbatim IK text'
  );

  // --- Test 12: Provenance metadata recorded ---
  const rawData = submissionRes.contribution.raw;
  const hasProvenance = Boolean(
    rawData.contributorId &&
    rawData.contributorName &&
    rawData.dialect &&
    rawData.category &&
    rawData.source &&
    rawData.consentId &&
    rawData.license &&
    rawData.createdAt &&
    rawData.inputMethod
  );
  assert(hasProvenance, 'Test 12: Complete provenance recorded (contributorId, contributorName, dialect, category, source, consentId, license, createdAt, inputMethod)');

  // --- Test 13: Offline queuing status ---
  assert(submissionRes.contribution.raw.syncStatus === 'pending_sync', 'Test 13: Offline submission queued as pending_sync');

  // --- Test 14: No verifiedData generated at intake time ---
  assert(submissionRes.contribution.verified === undefined, 'Test 14: No verifiedData generated at initial contribution intake');

  console.log('\n====================================================');
  console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runBall155Tests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
