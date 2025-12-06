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
    el.textContent = `Hỗ trợ KN CV${soCV} - ${soTB} - ${nhomDV} ${goiDV}`;
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
  ['EmailChiNhanh_GTGT', 'EmailGTGT_GTGT', 'EmailSubject_GTGT', 'EmailBody_GTGT'].forEach((id) => {
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
    });

  if (cn)
    cn.addEventListener('change', () => {
      updateBranchEmailFor('GTGT');
      syncBranchAndTypeFromGTGT();
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
      saveAs(out, `CV${soCV}_${soTB}_${tenNhom}.docx`);
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
  ['EmailChiNhanh_BNKN', 'EmailSubject_BNKN', 'EmailBody_BNKN'].forEach((id) => {
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
  if (cn) cn.addEventListener('change', () => updateBranchEmailFor('BNKN'));

  const soCVInput = document.querySelector('#tab-bnkn [name="SoCV"]');
  const soTBInput = document.querySelector('#tab-bnkn [name="SO_THUE_BAO"]');
  const tenGoiInput = document.getElementById('TenGoi_BNKN');

  [soCVInput, soTBInput, tenGoiInput].forEach((el) => {
    if (el) el.addEventListener('input', updateMailBNKN);
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
  ['EmailChiNhanh_PL2', 'EmailSubject_PL2', 'EmailBody_PL2'].forEach((id) => {
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
  if (cn) cn.addEventListener('change', () => updateBranchEmailFor('PL2'));

  const soCVInput = document.querySelector('#tab-pl2 [name="SoCV"]');
  const soTBInput = document.querySelector('#tab-pl2 [name="SO_THUE_BAO_KH"]');
  const tenGoiInput = document.getElementById('TenGoi_PL2');

  [soCVInput, soTBInput, tenGoiInput].forEach((el) => {
    if (el) el.addEventListener('input', updateMailPL2);
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

// ===== TAB 4: DANH SÁCH CHI NHÁNH (DanhsachCN.xlsx) =====
let CN_DATA = [];
let CN_HEADERS = [];

// highlight keyword (case-insensitive, theo đúng chữ user gõ)
function highlightKeyword(text, keyword) {
  if (!keyword) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(escaped, 'gi');
  return text.toString().replace(re, (m) => `<mark>${m}</mark>`);
}

// Tính điểm similarity cho 1 dòng
function scoreCNRow(item, queryNorm, tokens) {
  if (!queryNorm) return 0;
  let score = 0;
  const all = item.normAll;

  if (all === queryNorm) score += 100;
  else if (all.startsWith(queryNorm)) score += 75;
  else if (all.includes(queryNorm)) score += 40;

  // theo từng từ & từng cột
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
      const stt = idx + 1; // STT theo thứ tự đang hiển thị
      const tds = CN_HEADERS.map((h) => {
        const txt = item.cells[h] ?? '';
        return `<td>${highlightKeyword(txt, keyword)}</td>`;
      }).join('');
      return `<tr><td style="text-align:center;">${stt}</td>${tds}</tr>`;
    })
    .join('');
}

// ⬇️ HÀM CHÍNH BẠN DÁN ĐÈ VÀO ĐÂY
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

      // ✅ Lọc bỏ cột rác kiểu _EMPTY, __EMPTY_1,...
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
