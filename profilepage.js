document.addEventListener('DOMContentLoaded', function () {

  const PICTURE_KEY = 'cec_profile_picture';
  const DATA_KEY = 'cec_profile_data';
  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  const DEFAULT_DATA = {
    fullName: 'Jay Roel T. Becari',
    studentId: '24 144130',
    age: 20,
    email: 'jayroeltyhandsome@gmail.com',
    contact: '09123456789',
    address: 'Cebu, Philippines',
    course: 'BSIT',
    yearLevel: '3rd Year',
    section: 'Section 3',
    semester: '1st Semester',
    username: 'jaybecari',
    password: '*********'
  };

  const editBtn = document.getElementById('editBtn');
  const modalOverlay = document.getElementById('modalOverlay');
  const cancelBtn = document.getElementById('cancelBtn');
  const saveBtn = document.getElementById('saveBtn');

  // Display elements
  const displayName = document.getElementById('displayName');
  const displayFullName = document.getElementById('displayFullName');
  const displayId = document.getElementById('displayId');
  const displayAge = document.getElementById('displayAge');
  const displayEmail = document.getElementById('displayEmail');
  const displayContact = document.getElementById('displayContact');
  const displayAddress = document.getElementById('displayAddress');
  const displayCourse = document.getElementById('displayCourse');
  const displayYearLevel = document.getElementById('displayYearLevel');
  const displaySection = document.getElementById('displaySection');
  const displaySemester = document.getElementById('displaySemester');
  const displayCourseSection = document.getElementById('displayCourseSection');
  const displayUsername = document.getElementById('displayUsername');
  const displayPassword = document.getElementById('displayPassword');

  // Input elements
  const inputFullName = document.getElementById('inputFullName');
  const inputStudentId = document.getElementById('inputStudentId');
  const inputAge = document.getElementById('inputAge');
  const ageError = document.getElementById('ageError');
  const inputEmail = document.getElementById('inputEmail');
  const inputContact = document.getElementById('inputContact');
  const inputAddress = document.getElementById('inputAddress');
  const inputCourse = document.getElementById('inputCourse');
  const inputYearLevel = document.getElementById('inputYearLevel');
  const inputSection = document.getElementById('inputSection');
  const inputSemester = document.getElementById('inputSemester');
  const inputUsername = document.getElementById('inputUsername');
  const inputPassword = document.getElementById('inputPassword');

  // Profile picture elements (header)
  const avatarWrapper = document.getElementById('avatarWrapper');
  const avatarImg = document.getElementById('avatarImg');
  const avatarDefault = document.getElementById('avatarDefault');
  const avatarCamera = document.getElementById('avatarCamera');
  const avatarFileInput = document.getElementById('avatarFileInput');
  const avatarError = document.getElementById('avatarError');

  // Profile picture elements (modal)
  const modalAvatarImg = document.getElementById('modalAvatarImg');
  const modalAvatarDefault = document.getElementById('modalAvatarDefault');
  const changePhotoBtn = document.getElementById('changePhotoBtn');
  const modalFileInput = document.getElementById('modalFileInput');
  const modalAvatarError = document.getElementById('modalAvatarError');

  // Photo viewer elements
  const photoViewerOverlay = document.getElementById('photoViewerOverlay');
  const photoViewerClose = document.getElementById('photoViewerClose');
  const photoViewerContent = document.getElementById('photoViewerContent');
  const photoViewerImg = document.getElementById('photoViewerImg');
  const photoViewerDefault = document.getElementById('photoViewerDefault');

  // Holds the currently staged (not yet saved) picture chosen inside the modal
  let pendingPicture = null;

  // ---------- Picture helpers ----------

  function setAvatarDisplay(dataUrl, imgEl, defaultEl) {
    if (dataUrl) {
      imgEl.src = dataUrl;
      imgEl.style.display = 'block';
      defaultEl.style.display = 'none';
    } else {
      imgEl.removeAttribute('src');
      imgEl.style.display = 'none';
      defaultEl.style.display = 'block';
    }
  }

  function getSavedPicture() {
    try {
      return localStorage.getItem(PICTURE_KEY);
    } catch (e) {
      return null;
    }
  }

  function validateAndReadFile(file, errorEl, onSuccess) {
    errorEl.textContent = '';

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      errorEl.textContent = 'Please select a valid image file.';
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      errorEl.textContent = 'Image must be smaller than 5 MB.';
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      onSuccess(e.target.result);
    };
    reader.onerror = function () {
      errorEl.textContent = 'Please select a valid image file.';
    };
    reader.readAsDataURL(file);
  }

  function openHeaderFilePicker() {
    avatarFileInput.click();
  }

  // ---------- Photo viewer ----------

  function openPhotoViewer() {
    const savedPicture = getSavedPicture();
    if (savedPicture) {
      photoViewerImg.src = savedPicture;
      photoViewerImg.style.display = 'block';
      photoViewerDefault.style.display = 'none';
    } else {
      photoViewerImg.removeAttribute('src');
      photoViewerImg.style.display = 'none';
      photoViewerDefault.style.display = 'block';
    }
    photoViewerOverlay.classList.add('open');
  }

  function closePhotoViewer() {
    photoViewerOverlay.classList.remove('open');
  }

  // Clicking the profile picture itself opens the larger view.
  avatarWrapper.addEventListener('click', function (e) {
    if (e.target === avatarCamera || avatarCamera.contains(e.target)) return;
    openPhotoViewer();
  });

  // Clicking the camera icon opens the file picker to change the picture.
  avatarCamera.addEventListener('click', function (e) {
    e.stopPropagation();
    openHeaderFilePicker();
  });

  photoViewerClose.addEventListener('click', closePhotoViewer);

  // Clicking outside the image (on the dark overlay) closes the viewer.
  photoViewerOverlay.addEventListener('click', function (e) {
    if (!photoViewerContent.contains(e.target)) {
      closePhotoViewer();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && photoViewerOverlay.classList.contains('open')) {
      closePhotoViewer();
    }
  });

  avatarFileInput.addEventListener('change', function () {
    const file = avatarFileInput.files[0];
    validateAndReadFile(file, avatarError, function (dataUrl) {
      setAvatarDisplay(dataUrl, avatarImg, avatarDefault);
      setAvatarDisplay(dataUrl, modalAvatarImg, modalAvatarDefault);
      try {
        localStorage.setItem(PICTURE_KEY, dataUrl);
      } catch (e) {
        // storage may be full or unavailable; picture still shows for this session
      }
      pendingPicture = dataUrl;
    });
    avatarFileInput.value = '';
  });

  changePhotoBtn.addEventListener('click', function () {
    modalFileInput.click();
  });

  modalFileInput.addEventListener('change', function () {
    const file = modalFileInput.files[0];
    validateAndReadFile(file, modalAvatarError, function (dataUrl) {
      setAvatarDisplay(dataUrl, modalAvatarImg, modalAvatarDefault);
      pendingPicture = dataUrl;
    });
    modalFileInput.value = '';
  });

  // ---------- Profile data helpers ----------

  function getSavedData() {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Object.assign({}, DEFAULT_DATA, parsed);
    } catch (e) {
      return null;
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
    } catch (e) {
      // ignore storage errors
    }
  }

  function renderData(data) {
    displayFullName.textContent = data.fullName;
    displayName.textContent = data.fullName.toUpperCase();
    displayId.textContent = data.studentId;
    displayAge.textContent = data.age;
    displayEmail.textContent = data.email;
    displayContact.textContent = data.contact;
    displayAddress.textContent = data.address;
    displayCourse.textContent = data.course;
    displayYearLevel.textContent = data.yearLevel;
    displaySection.textContent = data.section;
    displaySemester.textContent = data.semester;
    displayCourseSection.textContent = data.course + ' - ' + data.section;
    displayUsername.textContent = data.username;
    displayPassword.textContent = data.password;
  }

  function loadProfile() {
    const saved = getSavedData();
    const data = saved || DEFAULT_DATA;
    renderData(data);

    const savedPicture = getSavedPicture();
    if (savedPicture) {
      setAvatarDisplay(savedPicture, avatarImg, avatarDefault);
    }
  }

  function currentDisplayedData() {
    return {
      fullName: displayFullName.textContent.trim(),
      studentId: displayId.textContent.trim(),
      age: displayAge.textContent.trim(),
      email: displayEmail.textContent.trim(),
      contact: displayContact.textContent.trim(),
      address: displayAddress.textContent.trim(),
      course: displayCourse.textContent.trim(),
      yearLevel: displayYearLevel.textContent.trim(),
      section: displaySection.textContent.trim(),
      semester: displaySemester.textContent.trim(),
      username: displayUsername.textContent.trim(),
      password: displayPassword.textContent.trim()
    };
  }

  // ---------- Modal open/close ----------

  function openModal() {
    const data = currentDisplayedData();

    inputFullName.value = data.fullName;
    inputStudentId.value = data.studentId;
    inputAge.value = data.age;
    inputEmail.value = data.email;
    inputContact.value = data.contact;
    inputAddress.value = data.address;
    inputCourse.value = data.course;
    inputYearLevel.value = data.yearLevel;
    inputSection.value = data.section;
    inputSemester.value = data.semester;
    inputUsername.value = data.username;
    inputPassword.value = ''; // don't prefill actual password characters

    ageError.textContent = '';
    modalAvatarError.textContent = '';
    avatarError.textContent = '';
    pendingPicture = null;

    setAvatarDisplay(getSavedPicture(), modalAvatarImg, modalAvatarDefault);

    modalOverlay.classList.add('open');
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
  }

  editBtn.addEventListener('click', openModal);
  cancelBtn.addEventListener('click', closeModal);

  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // ---------- Save ----------

  saveBtn.addEventListener('click', function () {
    // Validate age: required, whole number, 1-100
    const ageValue = inputAge.value.trim();
    const ageNum = parseInt(ageValue, 10);
    ageError.textContent = '';

    if (ageValue === '' || isNaN(ageNum) || ageNum < 1 || ageNum > 100 || String(ageNum) !== ageValue) {
      ageError.textContent = 'Please enter a valid age between 1 and 100.';
      return;
    }

    const newFullName = inputFullName.value.trim();
    const newStudentId = inputStudentId.value.trim();
    const newEmail = inputEmail.value.trim();
    const newContact = inputContact.value.trim();
    const newAddress = inputAddress.value.trim();
    const newCourse = inputCourse.value.trim();
    const newYearLevel = inputYearLevel.value.trim();
    const newSection = inputSection.value.trim();
    const newSemester = inputSemester.value.trim();
    const newUsername = inputUsername.value.trim();
    const newPassword = inputPassword.value;

    const current = currentDisplayedData();

    const updated = {
      fullName: newFullName || current.fullName,
      studentId: newStudentId || current.studentId,
      age: ageNum,
      email: newEmail || current.email,
      contact: newContact || current.contact,
      address: newAddress || current.address,
      course: newCourse || current.course,
      yearLevel: newYearLevel || current.yearLevel,
      section: newSection || current.section,
      semester: newSemester || current.semester,
      username: newUsername || current.username,
      password: newPassword ? '*'.repeat(newPassword.length) : current.password
    };

    renderData(updated);
    saveData(updated);

    // Apply any picture staged inside the modal to the header avatar
    if (pendingPicture) {
      setAvatarDisplay(pendingPicture, avatarImg, avatarDefault);
      try {
        localStorage.setItem(PICTURE_KEY, pendingPicture);
      } catch (e) {
        // ignore storage errors
      }
    }

    closeModal();
  });

  // On page load, restore saved profile info and picture if they exist
  loadProfile();

});
