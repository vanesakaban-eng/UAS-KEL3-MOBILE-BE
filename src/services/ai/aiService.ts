import { RowDataPacket } from 'mysql2';
import db from '../../mobile/config/db';
import { logAudit } from '../auditService';

export interface AiFinancialOutput {
  summary: string;
  category_suggestion: string;
  total_amount: number;
  risk_level: 'low' | 'medium' | 'high';
  insights: string[];
  actionable_advice: string[];
}

/**
 * Filter Prompt Injection:
 * Mencegah upaya pengguna memanipulasi instruksi model AI.
 */
export function filterPromptInjection(text: string): { isSafe: boolean; reason?: string } {
  const suspiciousPatterns = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
    /disregard\s+(all\s+)?(previous|prior)\s+instructions/i,
    /system\s+prompt/i,
    /jailbreak/i,
    /dan\s+mode/i,
    /you\s+are\s+now\s+in\s+developer\s+mode/i,
    /bypass\s+(safety|filter)/i,
    /reveal\s+(api\s+key|secret|password)/i,
    /<script[\s\S]*?>[\s\S]*?<\/script>/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(text)) {
      return {
        isSafe: false,
        reason: 'Input terindikasi mengandung prompt injection atau instruksi berbahaya.',
      };
    }
  }

  return { isSafe: true };
}

/**
 * Anonimisasi Data Sensitif (PII - Personally Identifiable Information):
 * Menyamarkan data pribadi sebelum dikirim ke AI.
 */
export function anonymizePii(text: string): string {
  let sanitized = text;

  // Masking Alamat Email -> [EMAIL_DIANONIMKAN]
  sanitized = sanitized.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL_DIANONIMKAN]',
  );

  // Masking Nomor Telepon Indonesia (08xx, +62xx) -> [TELEPON_DIANONIMKAN]
  sanitized = sanitized.replace(
    /(\+62|62|0)8[1-9][0-9]{6,10}/g,
    '[TELEPON_DIANONIMKAN]',
  );

  // Masking Nomor Kartu Kredit / Rekening / NIK (16 digit berurutan)
  sanitized = sanitized.replace(
    /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g,
    '[NOMOR_KARTU_DIANONIMKAN]',
  );

  return sanitized;
}

/**
 * Memvalidasi format JSON keluaran AI agar sesuai dengan schema yang ditentukan.
 */
export function validateAiJson(rawResponse: string): AiFinancialOutput {
  let cleaned = rawResponse.trim();

  // Hapus formatting markdown code block jika AI membungkusnya dalam ```json ... ```
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  const parsed = JSON.parse(cleaned);

  if (
    typeof parsed.summary !== 'string' ||
    typeof parsed.category_suggestion !== 'string' ||
    typeof parsed.total_amount !== 'number' ||
    !['low', 'medium', 'high'].includes(parsed.risk_level) ||
    !Array.isArray(parsed.insights) ||
    !Array.isArray(parsed.actionable_advice)
  ) {
    throw new Error('Format JSON keluaran AI tidak sesuai dengan output schema yang diwajibkan.');
  }

  return parsed as AiFinancialOutput;
}

/**
 * Memanggil Gemini API dengan struktur wajib: Role, Constraint, dan Output Schema.
 */
export async function generateFinancialInsight(
  userId: number,
  userInput: string,
  promptType: 'receipt_analysis' | 'financial_insight' | 'budget_advice' = 'financial_insight',
): Promise<{ id: number; data: AiFinancialOutput; verificationStatus: string }> {
  // 1. Keamanan: Filter Prompt Injection
  const safetyCheck = filterPromptInjection(userInput);
  if (!safetyCheck.isSafe) {
    throw new Error(safetyCheck.reason || 'Input tidak diizinkan oleh sistem keamanan.');
  }

  // 2. Keamanan: Anonimisasi Data sebelum masuk ke prompt
  const sanitizedInput = anonymizePii(userInput);

  // 3. Susun Prompt Terstandar (Role, Constraint, Output Schema)
  const roleInstruction =
    'ROLE: Anda adalah AI Financial Advisor profesional dari aplikasi UKu (Manajemen Keuangan Pribadi). ' +
    'Tugas Anda adalah menganalisis data finansial/struk belanja pengguna secara objektif, ramah, dan solutif.';

  const constraintInstruction =
    'CONSTRAINTS:\n' +
    '1. DILARANG memunculkan teks pengantar, penutup, atau tanda markdown seperti ```json.\n' +
    '2. HANYA kembalikan satu objek JSON tunggal yang valid.\n' +
    '3. Jangan pernah memberikan saran investasi berisiko tinggi tanpa label risk_level "high".\n' +
    '4. Abaikan data pribadi apa pun dan fokus hanya pada aspek finansial.';

  const outputSchemaInstruction =
    'OUTPUT SCHEMA (wajib dipatuhi):\n' +
    '{\n' +
    '  "summary": "String ringkasan analisis dalam 1-2 kalimat bahasa Indonesia",\n' +
    '  "category_suggestion": "String nama kategori pengeluaran/pemasukan",\n' +
    '  "total_amount": 0 (angka estimasi total dari input, jika tidak ada isi 0),\n' +
    '  "risk_level": "low" | "medium" | "high",\n' +
    '  "insights": ["String poin insight 1", "String poin insight 2"],\n' +
    '  "actionable_advice": ["String rekomendasi tindakan 1", "String rekomendasi tindakan 2"]\n' +
    '}';

  const fullPrompt = `${roleInstruction}\n\n${constraintInstruction}\n\n${outputSchemaInstruction}\n\nDATA INPUT PENGGUNA:\n"""\n${sanitizedInput}\n"""`;

  let aiRawOutput = '';
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== '' && apiKey !== 'YOUR_GEMINI_API_KEY_HERE') {
    try {
      // Panggilan resmi ke Gemini REST API (gemini-1.5-flash)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: fullPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.2,
              responseMimeType: 'application/json',
            },
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.warn('[Gemini API Warning] Status:', response.status, errorText);
        throw new Error(`Gemini API Error: ${response.statusText}`);
      }

      const resJson = (await response.json()) as any;
      aiRawOutput = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (apiErr) {
      console.warn('[Gemini API Fallback] Beralih ke intelligent internal fallback engine:', apiErr);
      aiRawOutput = generateFallbackJson(sanitizedInput);
    }
  } else {
    // Fallback jika API key belum dikonfigurasi di .env
    aiRawOutput = generateFallbackJson(sanitizedInput);
  }

  // 4. Validasi Output JSON
  const validatedData = validateAiJson(aiRawOutput);

  // 5. Simpan Hasil AI ke Database MySQL
  const [insertResult] = (await db.query(
    `INSERT INTO ai_results (user_id, prompt_type, raw_input, sanitized_input, ai_output_json, verification_status)
     VALUES (?, ?, ?, ?, ?, 'approved')`,
    [
      userId,
      promptType,
      userInput,
      sanitizedInput,
      JSON.stringify(validatedData),
    ],
  )) as any[];

  const aiResultId = insertResult.insertId;

  // Catat Audit Log
  await logAudit({
    userId,
    action: 'AI_INSIGHT_GENERATED',
    resource: 'ai_results',
    resourceId: aiResultId,
    details: { promptType, riskLevel: validatedData.risk_level },
  });

  return {
    id: aiResultId,
    data: validatedData,
    verificationStatus: 'approved',
  };
}

/**
 * Intelligent Fallback Engine yang menghasilkan format JSON sesuai skema
 * jika Gemini API Key belum terpasang atau kuota habis.
 */
function generateFallbackJson(input: string): string {
  const lower = input.toLowerCase();
  let estimatedAmount = 0;
  const numMatch = input.match(/(\d[\d.,]*)/);
  if (numMatch) {
    const rawNum = numMatch[1].replace(/[.,]/g, '');
    estimatedAmount = Number(rawNum) || 0;
  }

  let category = 'Kebutuhan Harian';
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  if (lower.includes('makan') || lower.includes('kopi') || lower.includes('resto') || lower.includes('bill')) {
    category = 'Makanan & Minuman';
  } else if (lower.includes('bensin') || lower.includes('ojek') || lower.includes('transport')) {
    category = 'Transportasi';
  } else if (lower.includes('belanja') || lower.includes('mall') || lower.includes('baju')) {
    category = 'Belanja & Kebutuhan';
    riskLevel = 'medium';
  } else if (lower.includes('hutang') || lower.includes('pinjol') || lower.includes('kredit')) {
    category = 'Tagihan & Utilitas';
    riskLevel = 'high';
  }

  const result: AiFinancialOutput = {
    summary: `Analisis aktivitas finansial menunjukkan alokasi pada kategori ${category}.`,
    category_suggestion: category,
    total_amount: estimatedAmount,
    risk_level: riskLevel,
    insights: [
      `Aktivitas terdeteksi dominan pada pos pengeluaran ${category}.`,
      estimatedAmount > 200000
        ? 'Nominal pengeluaran cukup signifikan untuk pos harian.'
        : 'Nominal pengeluaran masih dalam batas wajar standar harian.',
    ],
    actionable_advice: [
      'Pastikan mencatat pengeluaran ini pada rincian anggaran bulanan.',
      'Bandingkan dengan alokasi sisa budget UKu untuk menjaga kesehatan kas.',
    ],
  };

  return JSON.stringify(result);
}

/**
 * Verifikasi Manual Hasil AI oleh Web Admin
 */
export async function verifyAiResult(
  aiResultId: number,
  adminId: number,
  status: 'approved' | 'rejected',
  verificationNote?: string,
): Promise<boolean> {
  const [updateResult] = (await db.query(
    `UPDATE ai_results
     SET verification_status = ?, verified_by = ?, verification_note = ?, verified_at = NOW()
     WHERE id = ?`,
    [status, adminId, verificationNote || null, aiResultId],
  )) as any[];

  if (updateResult.affectedRows > 0) {
    await logAudit({
      userId: adminId,
      action: status === 'approved' ? 'AI_RESULT_APPROVED' : 'AI_RESULT_REJECTED',
      resource: 'ai_results',
      resourceId: aiResultId,
      details: { status, verificationNote },
    });
    return true;
  }

  return false;
}
