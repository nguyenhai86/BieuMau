const GEMINI_API_KEY = 'AIzaSyCGRQ33kI73mjarBCMyxhaYJHu2zxHo09Y';
const GEMINI_MODEL_TAB4 = 'gemini-2.5-flash';

// ==== KHỞI TẠO TABS & FORM ====
document.addEventListener('DOMContentLoaded', () => {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');
      tabButtons.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(targetId);
      if (target) target.classList.add('active');
    });
  });

  // clear highlight khi user sửa lại
  document.addEventListener('input', (e) => {
    const fg = e.target.closest('.field-group.field-error');
    if (fg) fg.classList.remove('field-error');
  });

  // Ngày mặc định
  setTodayById('NgayFull_GTGT');
  setTodayById('NgayFull_BNKN');
  setTodayById('NgayFull_PL2');

  initGTGTForm();
  initBNKNForm();
  initPL2Form();
  loadDanhSachCN(); // Tab 4: chi nhánh

  const searchCN = document.getElementById('searchCN');
  if (searchCN) {
    searchCN.addEventListener('input', handleSearchCNInput);
  }

  // Khởi tạo công cụ Gemini cho Tab 4
  setupAIToolsTab4();
});

// ==== COMMON HELPERS ====
function setTodayById(id) {
  const input = document.getElementById(id);
  if (!input) return;
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  input.value = `${yyyy}-${mm}-${dd}`;
}

function updateBranchEmailFor(tabSuffix) {
  const loaiEl = document.getElementById(`LoaiThueBao_${tabSuffix}`);
  const cnEl = document.getElementById(`TenChiNhanh_${tabSuffix}`);
  const emailEl = document.getElementById(`EmailChiNhanh_${tabSuffix}`);
  if (!loaiEl || !cnEl || !emailEl) return;

  const loai = loaiEl.value;
  const cn = cnEl.value;

  if (loai && cn && BRANCH_EMAILS[cn] && BRANCH_EMAILS[cn][loai]) {
    emailEl.textContent = BRANCH_EMAILS[cn][loai];
  } else {
    emailEl.textContent = '-';
  }
}

// ===== NOTE CHUNG CHO 3 TAB =====
function buildNoteText(chiNhanh, soCV) {
  if (chiNhanh && soCV) {
    return `Ghi nhận chuyển GQKN ${chiNhanh} hỗ trợ BNKN ${soCV}. ACE báo KH vui lòng theo dõi thêm, khi có kết quả từ GQKN sẽ có nhân viên liên hệ KH.`;
  }
  return '-';
}

function updateNoteGTGT() {
  const cn = document.getElementById('TenChiNhanh_GTGT')?.value.trim() || '';
  const soCV = document.querySelector('#tab-gtgt [name="SoCV"]')?.value.trim() || '';
  const noteEl = document.getElementById('EmailNote_GTGT');
  if (!noteEl) return;
  noteEl.textContent = buildNoteText(cn, soCV);
}

function updateNoteBNKN() {
  const cn = document.getElementById('TenChiNhanh_BNKN')?.value.trim() || '';
  const soCV = document.querySelector('#tab-bnkn [name="SoCV"]')?.value.trim() || '';
  const noteEl = document.getElementById('EmailNote_BNKN');
  if (!noteEl) return;
  noteEl.textContent = buildNoteText(cn, soCV);
}

function updateNotePL2() {
  const cn = document.getElementById('TenChiNhanh_PL2')?.value.trim() || '';
  const soCV = document.querySelector('#tab-pl2 [name="SoCV"]')?.value.trim() || '';
  const noteEl = document.getElementById('EmailNote_PL2');
  if (!noteEl) return;
  noteEl.textContent = buildNoteText(cn, soCV);
}

// clear lỗi trực quan
function clearFormErrors(formElement) {
  if (!formElement) return;
  formElement
    .querySelectorAll('.field-group.field-error')
    .forEach((fg) => fg.classList.remove('field-error'));
}

// Sync CN + Loại thuê bao từ tab GTGT sang BNKN & PL2 (nếu đang trống)
function syncBranchAndTypeFromGTGT() {
  const cnGTGT = document.getElementById('TenChiNhanh_GTGT')?.value || '';
  const loaiGTGT = document.getElementById('LoaiThueBao_GTGT')?.value || '';

  if (cnGTGT) {
    const cnBNKN = document.getElementById('TenChiNhanh_BNKN');
    const cnPL2 = document.getElementById('TenChiNhanh_PL2');
    if (cnBNKN && !cnBNKN.value) cnBNKN.value = cnGTGT;
    if (cnPL2 && !cnPL2.value) cnPL2.value = cnGTGT;
  }
  if (loaiGTGT) {
    const loaiBNKN = document.getElementById('LoaiThueBao_BNKN');
    const loaiPL2 = document.getElementById('LoaiThueBao_PL2');
    if (loaiBNKN && !loaiBNKN.value) loaiBNKN.value = loaiGTGT;
    if (loaiPL2 && !loaiPL2.value) loaiPL2.value = loaiGTGT;
  }

  updateBranchEmailFor('BNKN');
  updateBranchEmailFor('PL2');
  // cập nhật Note theo CN + SoCV sau khi sync
  updateNoteBNKN();
  updateNotePL2();
}

// Copy nội dung mail
function copyEmailBody(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const text = el.textContent.trim();
  if (!text || text === '-') {
    alert('Chưa có nội dung mail để copy.');
    return;
  }
  navigator.clipboard
    .writeText(text)
    .then(() => alert('Đã copy nội dung mail.'))
    .catch(() => alert('Không copy được nội dung mail, vui lòng thử lại.'));
}

// Helper disable/enable nút submit + overlay tiến trình
function withSubmitLock(form, callback) {
  const btn = form.querySelector('button[type="submit"]');
  const overlay = document.getElementById('progressOverlay');
  const msgEl = document.getElementById('progressMessage');

  const showOverlay = (message) => {
    if (!overlay) return;
    if (msgEl && message) msgEl.textContent = message;
    overlay.classList.add('visible');
  };

  const hideOverlay = () => {
    if (!overlay) return;
    overlay.classList.remove('visible');
  };

  if (!btn) {
    showOverlay('Đang tạo file Word, vui lòng chờ...');
    callback()
      .catch((err) => {
        console.error(err);
        alert('Có lỗi xảy ra khi tạo file. Vui lòng kiểm tra lại.');
      })
      .finally(() => hideOverlay());
    return;
  }

  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Đang tạo file...';

  showOverlay('Đang tạo file Word, vui lòng chờ...');

  callback()
    .catch((err) => {
      console.error(err);
      alert('Có lỗi xảy ra khi tạo file. Vui lòng kiểm tra lại.');
    })
    .finally(() => {
      btn.disabled = false;
      btn.textContent = originalText;
      hideOverlay();
    });
}

// ===== TAB 1: GTGT =====
// Subject + body GTGT
function updateSubjectGTGT() {
  const soCV = document.querySelector('#tab-gtgt [name="SoCV"]').value.trim();
  const soTB = document.querySelector('#tab-gtgt [name="SO_THUE_BAO"]').value.trim();
  const nhomDV = document.querySelector('#tab-gtgt [name="TEN_NHOM_DV"]').value.trim();
  const goiDV = document.querySelector('#tab-gtgt [name="TEN_GOI"]').value.trim();

  const el = document.getElementById('EmailSubject_GTGT');
  if (!el) return;

  if (soCV && soTB && nhomDV && goiDV) {
    el.textContent = `Hỗ trợ BNKN ${soCV} - ${soTB} - ${nhomDV} ${goiDV}`;
  } else {
    el.textContent = '-';
  }
}

function updateEmailBodyGTGT() {
  const soTB = document.querySelector('#tab-gtgt [name="SO_THUE_BAO"]').value.trim();
  const soCV = document.querySelector('#tab-gtgt [name="SoCV"]').value.trim();
  const nhomDV = document.querySelector('#tab-gtgt [name="TEN_NHOM_DV"]').value.trim();
  const goiDV = document.querySelector('#tab-gtgt [name="TEN_GOI"]').value.trim();

  const el = document.getElementById('EmailBody_GTGT');
  if (!el) return;

  if (!soTB || !soCV || !nhomDV || !goiDV) {
    el.textContent = '-';
    return;
  }

  el.textContent = `Dear Chị Trang và anh Vũ,
Nhờ Anh Chị hỗ trợ KN sau

Số TB: ${soTB}
Số BNKN: ${soCV}
Dịch vụ: ${nhomDV} - ${goiDV}

Nhờ anh Vũ vui lòng kiểm tra KH có tương tác DV không ? Kiểm tra cước thực KH bị trừ bao nhiêu ?
Em cảm ơn Anh Chị đã hỗ trợ.`;
}

function updateGTGTEmailContact() {
  const dv = document.getElementById('DichVuGTGT').value;
  const span = document.getElementById('EmailGTGT_GTGT');
  if (!span) return;
  if (dv && GTGT_CONTACTS[dv]) span.textContent = GTGT_CONTACTS[dv];
  else span.textContent = '-';
}

function resetMailPanelGTGT() {
  [
    'EmailChiNhanh_GTGT',
    'EmailGTGT_GTGT',
    'EmailSubject_GTGT',
    'EmailBody_GTGT',
    'EmailNote_GTGT'
  ].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = '-';
  });
}

function validateGTGTForm(formData, formElement) {
  clearFormErrors(formElement);

  for (const [key, value] of formData.entries()) {
    if (key === 'CCCD') continue;
    const trimmed = value.trim();
    const fieldEl = formElement.querySelector(`[name="${key}"]`);
    if (!trimmed) {
      const labelEl = fieldEl ? fieldEl.closest('.field-group')?.querySelector('label') : null;
      const labelText = labelEl ? labelEl.innerText.replace(/[:*]/g, '').trim() : key;
      const group = fieldEl ? fieldEl.closest('.field-group') : null;
      if (group) group.classList.add('field-error');
      alert('Vui lòng nhập đầy đủ thông tin: ' + labelText);
      if (fieldEl) fieldEl.focus();
      return false;
    }
  }

  const soThueBaoEl = formElement.querySelector('[name="SO_THUE_BAO"]');
  if (soThueBaoEl) {
    const v = soThueBaoEl.value.trim();
    const is9 = /^\d{9}$/.test(v);
    const zero = v.startsWith('0');
    if (!is9 || zero) {
      const group = soThueBaoEl.closest('.field-group');
      if (group) group.classList.add('field-error');
      alert('Số thuê bao phải gồm đúng 9 chữ số và không bắt đầu bằng số 0 (VD: 903xxxxxx).');
      soThueBaoEl.focus();
      return false;
    }
  }

  const soCVEl = formElement.querySelector('[name="SoCV"]');
  if (soCVEl) {
    const cvValue = soCVEl.value.trim();
    if (!/^\d+$/.test(cvValue)) {
      const group = soCVEl.closest('.field-group');
      if (group) group.classList.add('field-error');
      alert('Số công văn phải là số.');
      soCVEl.focus();
      return false;
    }
  }

  return true;
}

function initGTGTForm() {
  const form = document.getElementById('wordForm');
  if (!form) return;

  resetMailPanelGTGT();

  const loaiTB = document.getElementById('LoaiThueBao_GTGT');
  const cn = document.getElementById('TenChiNhanh_GTGT');
  const dv = document.getElementById('DichVuGTGT');

  if (loaiTB)
    loaiTB.addEventListener('change', () => {
      updateBranchEmailFor('GTGT');
      syncBranchAndTypeFromGTGT();
      updateNoteGTGT();
    });

  if (cn)
    cn.addEventListener('change', () => {
      updateBranchEmailFor('GTGT');
      syncBranchAndTypeFromGTGT();
      updateNoteGTGT();
    });

  if (dv) dv.addEventListener('change', updateGTGTEmailContact);

  const soCVInput = document.querySelector('#tab-gtgt [name="SoCV"]');
  const soTBInput = document.querySelector('#tab-gtgt [name="SO_THUE_BAO"]');
  const nhomDVInput = document.querySelector('#tab-gtgt [name="TEN_NHOM_DV"]');
  const goiDVInput = document.querySelector('#tab-gtgt [name="TEN_GOI"]');

  [soCVInput, soTBInput, nhomDVInput, goiDVInput].forEach((el) => {
    if (el) {
      el.addEventListener('input', () => {
        updateSubjectGTGT();
        updateEmailBodyGTGT();
        updateNoteGTGT();
      });
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    if (!validateGTGTForm(formData, form)) return;

    withSubmitLock(form, async () => {
      const data = {};
      for (const [key, value] of formData.entries()) data[key] = value.trim();

      const dateStr = document.getElementById('NgayFull_GTGT').value;
      if (dateStr) {
        const [Y, M, D] = dateStr.split('-');
        data['Ngay'] = String(parseInt(D));
        data['Thang'] = String(parseInt(M));
        data['Nam'] = Y;
      }

      const resp = await fetch('MauPhieuKhieuNaiDonDVGT.docx');
      if (!resp.ok) throw new Error('Không tìm thấy file MauPhieuKhieuNaiDonDVGT.docx');
      const buf = await resp.arrayBuffer();
      const zip = new PizZip(buf);

      const doc = new window.docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true
      });

      doc.render(data);

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      const soCV = (data['SoCV'] || '').replace(/\s+/g, '');
      const soTB = (data['SO_THUE_BAO'] || '').replace(/\s+/g, '');
      const tenNhom = (data['TEN_NHOM_DV'] || '').replace(/\s+/g, '');
      saveAs(out, `BNKN ${soCV}_${soTB}_${tenNhom}.docx`);
    });
  });
}

function resetGTGTForm() {
  const form = document.getElementById('wordForm');
  if (!form) return;
  form.reset();
  setTodayById('NgayFull_GTGT');
  resetMailPanelGTGT();
  clearFormErrors(form);
}

// ==== TAB 2: BNKN ====
function resetMailPanelBNKN() {
  ['EmailChiNhanh_BNKN', 'EmailSubject_BNKN', 'EmailBody_BNKN', 'EmailNote_BNKN'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = '-';
  });
}

function validateBNKNForm(fd, formElement) {
  clearFormErrors(formElement);

  for (const [key, value] of fd.entries()) {
    // 2 trường CCCD được phép bỏ trống
    if (key === 'CCCD_KN' || key === 'CCCD_KH') continue;

    if (!value.trim()) {
      const fieldEl = formElement.querySelector(`[name="${key}"]`);
      const labelEl = fieldEl ? fieldEl.closest('.field-group')?.querySelector('label') : null;
      const labelText = labelEl ? labelEl.innerText.replace(/[:*]/g, '').trim() : key;
      const group = fieldEl ? fieldEl.closest('.field-group') : null;
      if (group) group.classList.add('field-error');
      alert('Vui lòng điền đầy đủ thông tin: ' + labelText);
      if (fieldEl) fieldEl.focus();
      return false;
    }
  }

  // Validate số thuê bao
  const soThueBaoEl = formElement.querySelector('[name="SO_THUE_BAO"]');
  if (soThueBaoEl) {
    const v = soThueBaoEl.value.trim();
    const is9 = /^\d{9}$/.test(v);
    const zero = v.startsWith('0');
    if (!is9 || zero) {
      const group = soThueBaoEl.closest('.field-group');
      if (group) group.classList.add('field-error');
      alert('Số thuê bao phải gồm đúng 9 chữ số và không bắt đầu bằng số 0 (VD: 903xxxxxx).');
      soThueBaoEl.focus();
      return false;
    }
  }

  // Validate số công văn
  const soCVEl = formElement.querySelector('[name="SoCV"]');
  if (soCVEl) {
    const cvValue = soCVEl.value.trim();
    if (!/^\d+$/.test(cvValue)) {
      const group = soCVEl.closest('.field-group');
      if (group) group.classList.add('field-error');
      alert('Số công văn phải là số.');
      soCVEl.focus();
      return false;
    }
  }

  return true;
}

function updateMailBNKN() {
  const soCV = document.querySelector('#tab-bnkn [name="SoCV"]').value.trim();
  const soTB = document.querySelector('#tab-bnkn [name="SO_THUE_BAO"]').value.trim();
  const tenGoi = document.getElementById('TenGoi_BNKN').value.trim();

  const subjEl = document.getElementById('EmailSubject_BNKN');
  const bodyEl = document.getElementById('EmailBody_BNKN');

  const prefix = 'Hỗ trợ BNKN';

  if (soCV && soTB && tenGoi) {
    subjEl.textContent = `${prefix} ${soCV} - ${soTB} - ${tenGoi}`;
  } else if (soCV && soTB) {
    subjEl.textContent = `${prefix} ${soCV} - ${soTB} - ...`;
  } else if (soCV) {
    subjEl.textContent = `${prefix} ${soCV} - ...`;
  } else {
    subjEl.textContent = '-';
  }

  if (soCV) {
    bodyEl.textContent = `Dear Anh Chị,
Em gửi Anh Chị BNKN ${soCV}. Nhờ Anh Chị hỗ trợ giúp.
Em cảm ơn`;
  } else {
    bodyEl.textContent = '-';
  }
}

function initBNKNForm() {
  const form = document.getElementById('bnknForm');
  if (!form) return;

  resetMailPanelBNKN();

  const loaiTB = document.getElementById('LoaiThueBao_BNKN');
  const cn = document.getElementById('TenChiNhanh_BNKN');

  if (loaiTB) loaiTB.addEventListener('change', () => updateBranchEmailFor('BNKN'));
  if (cn)
    cn.addEventListener('change', () => {
      updateBranchEmailFor('BNKN');
      updateNoteBNKN();
    });

  const soCVInput = document.querySelector('#tab-bnkn [name="SoCV"]');
  const soTBInput = document.querySelector('#tab-bnkn [name="SO_THUE_BAO"]');
  const tenGoiInput = document.getElementById('TenGoi_BNKN');

  [soCVInput, soTBInput, tenGoiInput].forEach((el) => {
    if (el)
      el.addEventListener('input', () => {
        updateMailBNKN();
        updateNoteBNKN();
      });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    if (!validateBNKNForm(fd, form)) return;

    withSubmitLock(form, async () => {
      const data = {};
      for (const [k, v] of fd.entries()) data[k] = v.trim();

      const d = document.getElementById('NgayFull_BNKN').value;
      const [Y, M, D] = d.split('-');
      data['Ngay'] = String(parseInt(D));
      data['Thang'] = String(parseInt(M));
      data['Nam'] = Y;

      const resp = await fetch('PHULUC1.docx');
      if (!resp.ok) throw new Error('Không tìm thấy file PHULUC1.docx');
      const buf = await resp.arrayBuffer();
      const zip = new PizZip(buf);

      const doc = new window.docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true
      });

      doc.render(data);

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      saveAs(out, `BNKN ${data.SoCV}_${data.SO_THUE_BAO}.docx`);
    });
  });
}

function resetBNKNForm() {
  const form = document.getElementById('bnknForm');
  if (!form) return;
  form.reset();
  setTodayById('NgayFull_BNKN');
  resetMailPanelBNKN();
  clearFormErrors(form);
}

// ==== TAB 3: PHỤ LỤC 2 ====
function resetMailPanelPL2() {
  ['EmailChiNhanh_PL2', 'EmailSubject_PL2', 'EmailBody_PL2', 'EmailNote_PL2'].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.textContent = '-';
  });
}

function validatePL2Form(fd, formElement) {
  clearFormErrors(formElement);

  for (const [key, value] of fd.entries()) {
    if (key === 'CCCD_KN' || key === 'CCCD_KH') continue;
    if (!value.trim()) {
      const fieldEl = formElement.querySelector(`[name="${key}"]`);
      const labelEl = fieldEl ? fieldEl.closest('.field-group')?.querySelector('label') : null;
      const labelText = labelEl ? labelEl.innerText.replace(/[:*]/g, '').trim() : key;
      const group = fieldEl ? fieldEl.closest('.field-group') : null;
      if (group) group.classList.add('field-error');
      alert('Vui lòng điền đầy đủ thông tin: ' + labelText);
      if (fieldEl) fieldEl.focus();
      return false;
    }
  }

  const soKhEl = formElement.querySelector('[name="SO_THUE_BAO_KH"]');
  if (soKhEl) {
    const v = soKhEl.value.trim();
    const is9 = /^\d{9}$/.test(v);
    const zero = v.startsWith('0');
    if (!is9 || zero) {
      const group = soKhEl.closest('.field-group');
      if (group) group.classList.add('field-error');
      alert('Số thuê bao KH phải gồm đúng 9 chữ số và không bắt đầu bằng số 0 (VD: 903xxxxxx).');
      soKhEl.focus();
      return false;
    }
  }

  const soLhEl = formElement.querySelector('[name="SO_THUE_BAO_LH"]');
  if (soLhEl) {
    const v = soLhEl.value.trim();
    const is9 = /^\d{9}$/.test(v);
    const zero = v.startsWith('0');
    if (!is9 || zero) {
      const group = soLhEl.closest('.field-group');
      if (group) group.classList.add('field-error');
      alert(
        'Số điện thoại liên hệ phải gồm đúng 9 chữ số và không bắt đầu bằng số 0 (VD: 903xxxxxx).'
      );
      soLhEl.focus();
      return false;
    }
  }

  const soCVEl = formElement.querySelector('[name="SoCV"]');
  if (soCVEl) {
    const cvValue = soCVEl.value.trim();
    if (!/^\d+$/.test(cvValue)) {
      const group = soCVEl.closest('.field-group');
      if (group) group.classList.add('field-error');
      alert('Số công văn phải là số.');
      soCVEl.focus();
      return false;
    }
  }

  return true;
}

function updateMailPL2() {
  const soCV = document.querySelector('#tab-pl2 [name="SoCV"]').value.trim();
  const soTB = document.querySelector('#tab-pl2 [name="SO_THUE_BAO_KH"]').value.trim();
  const tenGoi = document.getElementById('TenGoi_PL2').value.trim();

  const subjEl = document.getElementById('EmailSubject_PL2');
  const bodyEl = document.getElementById('EmailBody_PL2');

  const prefix = 'Hỗ trợ BNKN';

  if (soCV && soTB && tenGoi) {
    subjEl.textContent = `${prefix} ${soCV} - ${soTB} - ${tenGoi}`;
  } else if (soCV && soTB) {
    subjEl.textContent = `${prefix} ${soCV} - ${soTB} - ...`;
  } else if (soCV) {
    subjEl.textContent = `${prefix} ${soCV} - ...`;
  } else {
    subjEl.textContent = '-';
  }

  if (soCV) {
    bodyEl.textContent = `Dear Anh Chị,
Em gửi Anh Chị BNKN ${soCV}. Nhờ Anh Chị hỗ trợ giúp.
Em cảm ơn`;
  } else {
    bodyEl.textContent = '-';
  }
}

function initPL2Form() {
  const form = document.getElementById('pl2Form');
  if (!form) return;

  resetMailPanelPL2();

  const loaiTB = document.getElementById('LoaiThueBao_PL2');
  const cn = document.getElementById('TenChiNhanh_PL2');

  if (loaiTB) loaiTB.addEventListener('change', () => updateBranchEmailFor('PL2'));
  if (cn)
    cn.addEventListener('change', () => {
      updateBranchEmailFor('PL2');
      updateNotePL2();
    });

  const soCVInput = document.querySelector('#tab-pl2 [name="SoCV"]');
  const soTBInput = document.querySelector('#tab-pl2 [name="SO_THUE_BAO_KH"]');
  const tenGoiInput = document.getElementById('TenGoi_PL2');

  [soCVInput, soTBInput, tenGoiInput].forEach((el) => {
    if (el)
      el.addEventListener('input', () => {
        updateMailPL2();
        updateNotePL2();
      });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    if (!validatePL2Form(fd, form)) return;

    withSubmitLock(form, async () => {
      const data = {};
      for (const [k, v] of fd.entries()) data[k] = v.trim();

      const d = document.getElementById('NgayFull_PL2').value;
      const [Y, M, D] = d.split('-');
      data['Ngay'] = String(parseInt(D));
      data['Thang'] = String(parseInt(M));
      data['Nam'] = Y;

      const resp = await fetch('PHULUC2.docx');
      if (!resp.ok) throw new Error('Không tìm thấy file PHULUC2.docx');
      const buf = await resp.arrayBuffer();
      const zip = new PizZip(buf);

      const doc = new window.docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true
      });

      doc.render(data);

      const out = doc.getZip().generate({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });

      saveAs(out, `BNKN ${data.SoCV}_${data.SO_THUE_BAO_KH}.docx`);
    });
  });
}

function resetPL2Form() {
  const form = document.getElementById('pl2Form');
  if (!form) return;
  form.reset();
  setTodayById('NgayFull_PL2');
  resetMailPanelPL2();
  clearFormErrors(form);
}
// ==== HỖ TRỢ TÌM KIẾM KHÔNG DẤU (dùng chung TAB 4) ====
// Bỏ dấu tiếng Việt + đưa về chữ thường
function normalizeVN(str) {
  if (!str) return '';
  return str
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // bỏ dấu
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .trim();
}

// ===== TAB 4: DANH SÁCH CHI NHÁNH & CÔNG CỤ GEMINI =====
let CN_DATA = [];
let CN_HEADERS = [];

// Tìm tên cột có chứa keyword (đã bỏ dấu)
function findHeaderByKeyword(keyword) {
  if (!CN_HEADERS || !CN_HEADERS.length) return null;
  const kwNorm = normalizeVN(keyword);
  return CN_HEADERS.find((h) => normalizeVN(h).includes(kwNorm)) || null;
}

// ===== HIGHLIGHT & TÌM KIẾM BẢNG CHI NHÁNH =====

// highlight keyword (case-insensitive, theo đúng chữ user gõ)
function highlightKeyword(text, keyword) {
  if (!keyword) return text;
  if (!text) return '';

  const normText = normalizeVN(text);
  const normKey = normalizeVN(keyword);
  const index = normText.indexOf(normKey);
  if (index === -1) return text;

  // Tìm vị trí gần đúng trong chuỗi gốc (độ dài có dấu có thể lệch)
  // Để đơn giản vẫn cắt theo length keyword user gõ
  const before = text.substring(0, index);
  const match = text.substring(index, index + keyword.length);
  const after = text.substring(index + keyword.length);

  return `${before}<span class="highlight-term">${match}</span>${after}`;
}

// Tính điểm similarity cho 1 dòng (dùng cho search)
function scoreCNRow(item, queryNorm, tokens) {
  if (!queryNorm) return 0;
  let score = 0;
  const all = item.normAll;

  if (all === queryNorm) score += 100;
  else if (all.startsWith(queryNorm)) score += 75;
  else if (all.includes(queryNorm)) score += 40;

  tokens.forEach((t) => {
    if (!t) return;
    CN_HEADERS.forEach((h) => {
      const vNorm = normalizeVN(item.cells[h] ?? '');
      if (!vNorm) return;
      if (vNorm === t) score += 25;
      else if (vNorm.startsWith(t)) score += 15;
      else if (vNorm.includes(t)) score += 8;
    });
  });

  return score;
}

// Render body bảng
function renderCNTable(rows, keyword = '') {
  const tbody = document.getElementById('CNBody');
  if (!tbody) return;

  if (!rows || !rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="100" class="table-placeholder">Không tìm thấy kết quả phù hợp.</td></tr>';
    return;
  }

  tbody.innerHTML = rows
    .map((item, idx) => {
      const stt = idx + 1;
      const tds = CN_HEADERS.map((h) => {
        const txt = item.cells[h] ?? '';
        return `<td>${highlightKeyword(txt, keyword)}</td>`;
      }).join('');
      return `<tr><td style="text-align:center;">${stt}</td>${tds}</tr>`;
    })
    .join('');
}

// Load DanhsachCN.xlsx
function loadDanhSachCN() {
  const thead = document.getElementById('CNThead');
  const tbody = document.getElementById('CNBody');
  if (!thead || !tbody) return;

  tbody.innerHTML =
    '<tr><td colspan="100" class="table-placeholder">Đang tải dữ liệu từ file DanhsachCN.xlsx...</td></tr>';

  fetch('DanhsachCN.xlsx')
    .then((res) => {
      if (!res.ok) throw new Error('Không đọc được file Excel DanhsachCN.xlsx');
      return res.arrayBuffer();
    })
    .then((buf) => {
      const data = new Uint8Array(buf);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];

      const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      if (!rows.length) {
        CN_DATA = [];
        CN_HEADERS = [];
        thead.innerHTML = '';
        tbody.innerHTML =
          '<tr><td colspan="100" class="table-placeholder">Không có dữ liệu trong file Excel.</td></tr>';
        return;
      }

      // Lọc bỏ cột rác kiểu _EMPTY, __EMPTY_1,...
      CN_HEADERS = Object.keys(rows[0] || {}).filter((h) => h && !/^_+EMPTY/i.test(h));

      // Header bảng (thêm cột STT phía trước)
      thead.innerHTML =
        `<tr><th style="width:60px; text-align:center;">STT</th>` +
        CN_HEADERS.map((h) => `<th>${h}</th>`).join('') +
        `</tr>`;

      // Chuẩn hoá dữ liệu + normAll để search
      CN_DATA = rows.map((row, index) => {
        const cells = {};
        const allTexts = CN_HEADERS.map((h) => row[h] ?? '').join(' ');
        CN_HEADERS.forEach((h) => {
          cells[h] = row[h] ?? '';
        });

        return {
          index,
          cells,
          normAll: normalizeVN(allTexts),
          _score: 0
        };
      });

      renderCNTable(CN_DATA);
    })
    .catch((err) => {
      console.error(err);
      tbody.innerHTML =
        '<tr><td colspan="100" class="table-placeholder" style="color:#b91c1c;">Không đọc được file DanhsachCN.xlsx. Vui lòng kiểm tra lại tên file và vị trí.</td></tr>';
    });
}

// Xử lý khi gõ tìm kiếm
function handleSearchCNInput(e) {
  const keyword = (e.target.value || '').trim();
  if (!CN_DATA.length) return;

  if (!keyword) {
    renderCNTable(CN_DATA);
    return;
  }

  const qNorm = normalizeVN(keyword);
  const tokens = qNorm.split(/\s+/).filter(Boolean);

  const matched = CN_DATA.map((item) => {
    const s = scoreCNRow(item, qNorm, tokens);
    return { ...item, _score: s };
  })
    .filter((x) => x._score > 0)
    .sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      return a.index - b.index;
    })
    .map((x) => ({
      index: x.index,
      cells: x.cells,
      normAll: x.normAll,
      _score: x._score
    }));

  if (!matched.length) {
    renderCNTable([], keyword);
  } else {
    renderCNTable(matched, keyword);
  }
}

// ===== TAB 4: TÍCH HỢP GEMINI (CHUẨN HÓA ĐỊA CHỈ + DỰ ĐOÁN TTKD) =====

// Gắn event cho 2 nút Gemini
function setupAIToolsTab4() {
  const btnNorm = document.getElementById('btnNormalizeAddress');
  const btnTTKD = document.getElementById('btnPredictTTKD');

  if (btnNorm) btnNorm.addEventListener('click', handleNormalizeAddress);
  if (btnTTKD) btnTTKD.addEventListener('click', handlePredictTTKD);
}

// UI helper
function showAIStatus(message) {
  const box = document.getElementById('aiResult');
  if (!box) return;
  box.innerHTML = `<p>${message}</p>`;
}

// Nút Chuẩn hóa: chỉ hiển thị 1 dòng
function showNormalizedAddress(normalizedAddress) {
  const box = document.getElementById('aiResult');
  if (!box) return;

  const addr = normalizedAddress || '-';
  box.innerHTML = `<p><strong>Địa chỉ chuẩn hóa:</strong> ${addr}</p>`;
}

// Nút Dự đoán TTKD: hiển thị full thông tin
function showAIResult({ normalizedAddress, ttkdName, reasoning }) {
  const box = document.getElementById('aiResult');
  if (!box) return;

  const norm = normalizedAddress || '-';
  const ttkd = ttkdName || '(không xác định được từ danh sách)';
  const reason = reasoning || 'Không có giải thích.';

  box.innerHTML = `
    <p><strong>Địa chỉ chuẩn hóa:</strong> ${norm}</p>
    <p><strong>Tên TTKD mới đề xuất:</strong> ${ttkd}</p>
    <p><strong>Lý do chọn TTKD:</strong></p>
    <p>${reason.replace(/\n/g, '<br>')}</p>
  `;
}

function showAIError(errorMessage) {
  const box = document.getElementById('aiResult');
  if (!box) return;
  box.innerHTML = `<p class="ai-result-error">${errorMessage}</p>`;
}

// ===== GỌI GEMINI 1: CHUẨN HÓA ĐỊA CHỈ =====
async function callGeminiNormalize(rawAddress) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
    throw new Error('Chưa cấu hình GEMINI_API_KEY trong script.js');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_TAB4}:generateContent?key=${encodeURIComponent(
    GEMINI_API_KEY
  )}`;

  const instruction = `
Bạn là trợ lý nội bộ của Tổng Công ty Viễn thông MobiFone tại TP.HCM.
Nhiệm vụ: Chuẩn hóa địa chỉ khách hàng cung cấp về dạng đầy đủ, có dấu, chuẩn bưu chính Việt Nam.
- Bổ sung đầy đủ: số nhà (nếu có), tên đường, khu phố/ấp, phường/xã, quận/huyện, thành phố.
- Ưu tiên nhận diện địa chỉ tại TP. Hồ Chí Minh.
- Địa chỉ có thể dùng tên quận/phường CŨ hoặc MỚI. Không được tự bịa sai đơn vị hành chính.
- Nếu địa chỉ không đủ thông tin, cố gắng suy luận nhưng không bịa sai quận/phường.
- Nếu không thể suy luận, giữ nguyên phần không đoán được.

ĐỊA CHỈ THÔ:
${rawAddress}

YÊU CẦU ĐỊNH DẠNG:
Trả về DUY NHẤT một chuỗi JSON với cấu trúc:

{
  "normalizedAddress": "địa chỉ đã chuẩn hóa, có dấu, đầy đủ"
}

Không thêm bất kỳ chữ nào ngoài JSON (không thêm giải thích trước/sau).
  `.trim();

  const payload = {
    contents: [
      {
        parts: [{ text: instruction }]
      }
    ]
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.error('Gemini error body:', text);
    throw new Error(`Lỗi gọi Gemini API: ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';

  if (!text) {
    throw new Error('Không nhận được nội dung từ Gemini.');
  }

  let jsonString = text.trim();
  const firstBrace = jsonString.indexOf('{');
  const lastBrace = jsonString.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonString = jsonString.slice(firstBrace, lastBrace + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    console.error('Raw Gemini text:', text);
    throw new Error('Không parse được JSON từ phản hồi Gemini.');
  }

  return {
    normalizedAddress: parsed.normalizedAddress || ''
  };
}

// ===== GỌI GEMINI 2: DỰ ĐOÁN TÊN TTKD MỚI TỪ DANHSACHCN.XLSX =====
async function callGeminiPredictTTKD(normalizedAddress) {
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
    throw new Error('Chưa cấu hình GEMINI_API_KEY trong script.js');
  }

  if (!CN_DATA.length || !CN_HEADERS.length) {
    throw new Error('Chưa có dữ liệu DanhsachCN.xlsx để dự đoán TTKD.');
  }

  // Chuẩn hóa header để tìm đúng cột
  const normCache = {};
  const normHeader = (h) => {
    if (!h) return '';
    if (normCache[h]) return normCache[h];
    normCache[h] = normalizeVN(h);
    return normCache[h];
  };

  const findCol = (...keywords) =>
    CN_HEADERS.find((h) => {
      const n = normHeader(h);
      return keywords.some((k) => n.includes(k));
    }) || null;

  // CÁC CỘT QUAN TRỌNG (mới + cũ) THEO YÊU CẦU
  const COL_TTKD = findCol('ten ttkd moi', 'ten ttkd'); // Tên TTKD mới
  const COL_WARD_NEW = findCol('xa phuong moi', 'phuong xa moi');
  const COL_WARD_OLD = findCol('xa phuong cu', 'xa, phuong cu', 'phuong cu');
  const COL_DIST_NEW = findCol('quan/huyen moi', 'quanhuyen moi', 'quan moi', 'huyen moi');
  const COL_DIST_OLD = findCol('quan/huyen cu', 'quanhuyen cu', 'quan cu', 'huyen cu');
  const COL_BRANCH_OLD = findCol('ten chi nhanh cu', 'chi nhanh cu', 'cn cu');

  if (!COL_TTKD) {
    throw new Error('Không tìm thấy cột Tên TTKD mới trong DanhsachCN.xlsx.');
  }

  // Rút gọn dữ liệu chi nhánh gửi cho Gemini (chỉ giữ các cột cần thiết)
  const branchRows = CN_DATA.map((row) => ({
    ten_ttkd_moi: COL_TTKD ? row.cells[COL_TTKD] || '' : '',
    xa_phuong_moi: COL_WARD_NEW ? row.cells[COL_WARD_NEW] || '' : '',
    xa_phuong_cu: COL_WARD_OLD ? row.cells[COL_WARD_OLD] || '' : '',
    quan_huyen_moi: COL_DIST_NEW ? row.cells[COL_DIST_NEW] || '' : '',
    quan_huyen_cu: COL_DIST_OLD ? row.cells[COL_DIST_OLD] || '' : '',
    ten_chi_nhanh_cu: COL_BRANCH_OLD ? row.cells[COL_BRANCH_OLD] || '' : ''
  })).filter((r) => r.ten_ttkd_moi || r.ten_chi_nhanh_cu);

  const dsChiNhanhJson = JSON.stringify(branchRows, null, 2);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_TAB4}:generateContent?key=${encodeURIComponent(
    GEMINI_API_KEY
  )}`;

  const instruction = `
Bạn là trợ lý nội bộ của Tổng Công ty Viễn Thông MobiFone tại TP.HCM.

Nhiệm vụ:
- Nhận địa chỉ đã CHUẨN HÓA của khách hàng (ở TP.HCM).
- Nhận danh sách chi nhánh / TTKD (dữ liệu cả MỚI và CŨ) dưới dạng JSON.
- Chọn RA DUY NHẤT một "Tên TTKD mới" phù hợp nhất với địa chỉ.

Khi quyết định, bạn PHẢI đồng thời kiểm tra:
  • Tên TTKD mới (ten_ttkd_moi)
  • Xã/Phường mới (xa_phuong_moi)
  • Tên chi nhánh cũ (ten_chi_nhanh_cu)
  • Quận/Huyện cũ (quan_huyen_cu)
  • Xã/Phường cũ (xa_phuong_cu)
  • (Nếu có) Quận/Huyện mới (quan_huyen_moi)

Địa chỉ khách hàng có thể dùng:
  - tên phường/quận mới,
  - tên phường/quận cũ,
  - hoặc lẫn lộn (ví dụ phường mới nhưng quận cũ, hoặc có tên chi nhánh cũ).

Nếu rất khó phân biệt giữa 2 TTKD tương đương, hãy chọn TTKD có khả năng cao nhất và giải thích rõ.

ĐỊA CHỈ CHUẨN HÓA ĐỂ SO KHỚP:
"${normalizedAddress}"

DANH SÁCH CHI NHÁNH (JSON):
${dsChiNhanhJson}

YÊU CẦU ĐẦU RA:
Trả về DUY NHẤT một chuỗi JSON, không kèm chữ nào khác, với cấu trúc:

{
  "normalizedAddress": "địa chỉ đã sử dụng để so khớp (có thể giống input)",
  "ttkdName": "Tên TTKD mới được chọn",
  "reasoning": "Giải thích ngắn gọn dựa trên quận/huyện mới/cũ, phường mới/cũ, tên CN cũ..."
}
`.trim();

  const payload = {
    contents: [
      {
        parts: [{ text: instruction }]
      }
    ]
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    console.error('Gemini Predict error body:', text);
    throw new Error(`Lỗi gọi Gemini API (predict TTKD): ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';

  if (!text) {
    throw new Error('Không nhận được nội dung từ Gemini (predict TTKD).');
  }

  let jsonString = text.trim();
  const firstBrace = jsonString.indexOf('{');
  const lastBrace = jsonString.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonString = jsonString.slice(firstBrace, lastBrace + 1);
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    console.error('Raw Gemini Predict text:', text);
    throw new Error('Không parse được JSON từ phản hồi Gemini (predict TTKD).');
  }

  return {
    normalizedAddress: parsed.normalizedAddress || normalizedAddress,
    ttkdName: parsed.ttkdName || '',
    reasoning: parsed.reasoning || ''
  };
}

// ===== EVENT HANDLER 2 NÚT =====

// Nút 1: Chuẩn hóa địa chỉ
async function handleNormalizeAddress() {
  const input = document.getElementById('rawAddress');
  if (!input) return;

  const raw = (input.value || '').trim();
  if (!raw) {
    alert('Vui lòng nhập địa chỉ thô KH cung cấp.');
    input.focus();
    return;
  }

  showAIStatus('Đang nhờ Gemini chuẩn hóa địa chỉ, vui lòng chờ...');

  try {
    const result = await callGeminiNormalize(raw);
    const addr = result.normalizedAddress || raw;
    showNormalizedAddress(addr);
  } catch (err) {
    console.error(err);
    showAIError(
      err.message ||
        'Không gọi được Gemini để chuẩn hóa địa chỉ. Vui lòng kiểm tra lại API key / kết nối mạng.'
    );
  }
}

// Nút 2: Chuẩn hóa + dự đoán TTKD bằng Gemini (dùng dữ liệu Excel làm context)
async function handlePredictTTKD() {
  const input = document.getElementById('rawAddress');
  if (!input) return;

  const raw = (input.value || '').trim();
  if (!raw) {
    alert('Vui lòng nhập địa chỉ để dự đoán Tên TTKD.');
    input.focus();
    return;
  }

  showAIStatus('Đang nhờ Gemini chuẩn hóa địa chỉ và chọn TTKD theo danh sách, vui lòng chờ...');

  try {
    // B1: Chuẩn hóa địa chỉ bằng Gemini
    const normResult = await callGeminiNormalize(raw);
    const addr = normResult.normalizedAddress || raw;

    // B2: Dùng Gemini lần 2 để chọn TTKD, có dựa trên tất cả các cột trong DanhsachCN.xlsx
    const predictResult = await callGeminiPredictTTKD(addr);

    showAIResult({
      normalizedAddress: predictResult.normalizedAddress || addr,
      ttkdName: predictResult.ttkdName,
      reasoning: predictResult.reasoning
    });
  } catch (err) {
    console.error(err);
    showAIError(
      err.message ||
        'Không thực hiện được bước chuẩn hóa / dự đoán TTKD. Vui lòng kiểm tra lại API key / DanhsachCN.xlsx.'
    );
  }
}
