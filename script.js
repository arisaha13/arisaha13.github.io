function activateTab(btn) {
  closeLightbox();
  closeMapModal();
  var tabcontent = document.getElementsByClassName("tabcontent");
  for (var i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
    tabcontent[i].setAttribute("hidden", "");
  }
  var tablinks = document.getElementsByClassName("tablinks");
  for (var i = 0; i < tablinks.length; i++) {
    tablinks[i].className = tablinks[i].className.replace(" active", "");
    tablinks[i].setAttribute("aria-selected", "false");
    tablinks[i].setAttribute("tabindex", "-1");
  }
  var panel = document.getElementById(btn.getAttribute("aria-controls"));
  panel.style.display = "block";
  panel.removeAttribute("hidden");
  btn.className += " active";
  btn.setAttribute("aria-selected", "true");
  btn.setAttribute("tabindex", "0");
}

function openSection(evt) {
  activateTab(evt.currentTarget);
}

function handleTabKeydown(evt) {
  var moveKeys = ["ArrowLeft", "ArrowRight", "Home", "End"];
  if (moveKeys.indexOf(evt.key) === -1) return;

  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  var currentIndex = tabs.indexOf(document.activeElement);
  if (currentIndex === -1) return;

  var newIndex = currentIndex;
  if (evt.key === "ArrowRight") newIndex = (currentIndex + 1) % tabs.length;
  if (evt.key === "ArrowLeft") newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  if (evt.key === "Home") newIndex = 0;
  if (evt.key === "End") newIndex = tabs.length - 1;

  evt.preventDefault();
  tabs[newIndex].focus();
  tabs[newIndex].click();
}

document.querySelectorAll('[role="tab"]').forEach(function (tab) {
  tab.addEventListener("keydown", handleTabKeydown);
});

document.getElementById("tab-Photos").click();

function applyFilters() {
  closeLightbox();
  closeMapModal();
  var selects = document.querySelectorAll(".filter select");
  var activeFilters = Array.prototype.map.call(selects, function (select) {
    return { key: select.dataset.filterKey, value: select.value };
  });

  var items = document.querySelectorAll(".image-gallery > li");
  var visibleCount = 0;
  items.forEach(function (item) {
    var matches = activeFilters.every(function (filter) {
      return filter.value === "" || item.dataset[filter.key] === filter.value;
    });
    if (matches) {
      item.removeAttribute("hidden");
      visibleCount++;
    } else {
      item.setAttribute("hidden", "");
    }
  });

  var status = document.getElementById("filter-status");
  if (status) {
    status.textContent =
      visibleCount === items.length
        ? "Showing all " + items.length + " photos"
        : "Showing " + visibleCount + " of " + items.length + " photos";
  }
}

document.querySelectorAll(".filter select").forEach(function (select) {
  select.addEventListener("change", applyFilters);
});

var lightbox = document.getElementById("lightbox");
var lightboxImage = document.getElementById("lightbox-image");
var lightboxCaption = document.getElementById("lightbox-caption");
var lightboxCloseBtn = document.querySelector(".lightbox-close");
var lightboxPrevBtn = document.querySelector(".lightbox-prev");
var lightboxNextBtn = document.querySelector(".lightbox-next");
var lightboxTriggerEl = null;
var lightboxIndex = -1;

function getVisibleGalleryItems() {
  return Array.prototype.slice.call(
    document.querySelectorAll(".image-gallery > li:not([hidden])")
  );
}

function showLightboxItem(item) {
  var img = item.querySelector("img");
  var caption = item.querySelector(".overlay span");
  lightboxImage.src = img.src;
  lightboxImage.alt = img.alt;
  lightboxCaption.textContent = caption ? caption.textContent : "";
}

function openLightboxAt(index, triggerEl) {
  var items = getVisibleGalleryItems();
  if (!items.length) return;
  lightboxIndex = (index + items.length) % items.length;
  lightboxTriggerEl = triggerEl || document.activeElement;
  showLightboxItem(items[lightboxIndex]);
  lightbox.removeAttribute("hidden");
  document.body.classList.add("lightbox-open");
  lightboxCloseBtn.focus();
  document.addEventListener("keydown", handleLightboxKeydown);
}

function closeLightbox() {
  if (!lightbox || lightbox.hasAttribute("hidden")) return;
  lightbox.setAttribute("hidden", "");
  document.body.classList.remove("lightbox-open");
  document.removeEventListener("keydown", handleLightboxKeydown);
  if (lightboxTriggerEl) {
    lightboxTriggerEl.focus();
  }
}

function stepLightbox(delta) {
  var items = getVisibleGalleryItems();
  if (!items.length) return;
  lightboxIndex = (lightboxIndex + delta + items.length) % items.length;
  showLightboxItem(items[lightboxIndex]);
}

function handleLightboxKeydown(evt) {
  if (evt.key === "Escape") {
    evt.preventDefault();
    closeLightbox();
  } else if (evt.key === "ArrowLeft") {
    evt.preventDefault();
    stepLightbox(-1);
  } else if (evt.key === "ArrowRight") {
    evt.preventDefault();
    stepLightbox(1);
  } else if (evt.key === "Tab") {
    var focusable = [lightboxCloseBtn, lightboxPrevBtn, lightboxNextBtn];
    var currentIndex = focusable.indexOf(document.activeElement);
    var nextIndex;
    if (evt.shiftKey) {
      nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
    } else {
      nextIndex =
        currentIndex === -1 || currentIndex === focusable.length - 1
          ? 0
          : currentIndex + 1;
    }
    evt.preventDefault();
    focusable[nextIndex].focus();
  }
}

document.querySelectorAll(".gallery-item").forEach(function (btn) {
  btn.addEventListener("click", function () {
    var items = getVisibleGalleryItems();
    var li = btn.closest("li");
    openLightboxAt(items.indexOf(li), btn);
  });
});

lightboxCloseBtn.addEventListener("click", closeLightbox);
lightboxPrevBtn.addEventListener("click", function () {
  stepLightbox(-1);
});
lightboxNextBtn.addEventListener("click", function () {
  stepLightbox(1);
});
lightbox.addEventListener("click", function (evt) {
  if (evt.target === lightbox) closeLightbox();
});

var mapModal = document.getElementById("map-modal");
var mapOpenBtn = document.getElementById("map-open");
var mapCloseBtn = document.querySelector(".map-modal-close");
var mapTriggerEl = null;

function openMapModal() {
  if (!mapModal) return;
  mapTriggerEl = document.activeElement;
  mapModal.removeAttribute("hidden");
  document.body.classList.add("lightbox-open");
  mapCloseBtn.focus();
  document.addEventListener("keydown", handleMapModalKeydown);
}

function closeMapModal() {
  if (!mapModal || mapModal.hasAttribute("hidden")) return;
  mapModal.setAttribute("hidden", "");
  document.body.classList.remove("lightbox-open");
  document.removeEventListener("keydown", handleMapModalKeydown);
  if (mapTriggerEl) {
    mapTriggerEl.focus();
  }
}

function handleMapModalKeydown(evt) {
  if (evt.key === "Escape") {
    evt.preventDefault();
    closeMapModal();
    return;
  }
  if (evt.key !== "Tab") return;

  var focusable = [mapCloseBtn].concat(
    Array.prototype.slice.call(document.querySelectorAll(".map-pin"))
  );
  var currentIndex = focusable.indexOf(document.activeElement);
  var nextIndex;
  if (evt.shiftKey) {
    nextIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
  } else {
    nextIndex =
      currentIndex === -1 || currentIndex === focusable.length - 1
        ? 0
        : currentIndex + 1;
  }
  evt.preventDefault();
  focusable[nextIndex].focus();
}

if (mapOpenBtn) {
  mapOpenBtn.addEventListener("click", openMapModal);
}
if (mapCloseBtn) {
  mapCloseBtn.addEventListener("click", closeMapModal);
}
if (mapModal) {
  mapModal.addEventListener("click", function (evt) {
    if (evt.target === mapModal) closeMapModal();
  });
}

document.querySelectorAll(".map-pin").forEach(function (pin) {
  pin.addEventListener("click", function () {
    var countrySelect = document.getElementById("filter-country");
    closeMapModal();
    if (countrySelect) {
      countrySelect.value = pin.dataset.filterCountry;
      countrySelect.dispatchEvent(new Event("change"));
    }
  });
});

applyFilters();
