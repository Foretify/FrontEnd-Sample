// Upload Page Module
class UploadPage {
    constructor() {
        this.pageId = 'upload';
        this.uploadCards = [];
        this.cardCounter = 0;
        this.documentData = null;
        this.maxCards = 3;
    }

    async init() {
        await this.loadDocumentData();
        this.setupUploadPage();
        this.addUploadCard(); // Add first card by default
    }

    async loadDocumentData() {
        try {
            const response = await fetch('locations.json');
            this.documentData = await response.json();
        } catch (error) {
            console.error('Error loading document data:', error);
            this.documentData = { productTypes: [], documentTypes: [], versions: [] };
        }
    }

    setupUploadPage() {
        const addCardBtn = document.getElementById('addUploadCardBtn');
        if (addCardBtn) {
            addCardBtn.addEventListener('click', () => {
                if (this.uploadCards.length < this.maxCards) {
                    this.addUploadCard();
                }
            });
        }

        const submitExtractBtn = document.getElementById('submitExtractBtn');
        if (submitExtractBtn) {
            submitExtractBtn.addEventListener('click', () => {
                this.handleSubmitAndExtract();
            });
        }
    }

    addUploadCard() {
        // Check if max cards reached. There is only space for 3 maxCards upload cards.
        if (this.uploadCards.length >= this.maxCards) {
            return;
        }

        const cardId = `upload-card-${this.cardCounter++}`;
        const container = document.getElementById('uploadCardsContainer');
        const placeholder = container.querySelector('.add-card-placeholder');
        
        const card = document.createElement('div');
        card.className = 'upload-card';
        card.id = cardId;
        card.innerHTML = `
            <div class="card-header">
                <h3>Document Upload ${this.cardCounter}</h3>
                <button class="remove-card-btn" data-card-id="${cardId}">×</button>
            </div>
            <div class="card-body">
                <div class="form-row">
                    <div class="form-group">
                        <label for="${cardId}-productType">Product Type</label>
                        <select id="${cardId}-productType" class="form-select" data-card-id="${cardId}">
                            <option value="">Select Product Type</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="${cardId}-material">Material Type</label>
                        <select id="${cardId}-material" class="form-select" data-card-id="${cardId}" disabled>
                            <option value="">Select Material Type</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="${cardId}-documentType">Document Type</label>
                        <select id="${cardId}-documentType" class="form-select" data-card-id="${cardId}">
                            <option value="">Select Document Type</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="${cardId}-version">Version</label>
                        <select id="${cardId}-version" class="form-select" data-card-id="${cardId}">
                            <option value="">Select Version</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label for="${cardId}-file">Document File</label>
                    <div class="file-upload-wrapper">
                        <input type="file" id="${cardId}-file" class="file-input-hidden" accept="*/*">
                        <button type="button" class="file-upload-btn" data-card-id="${cardId}">Choose File</button>
                        <div class="file-name" id="${cardId}-filename">No file selected</div>
                    </div>
                </div>
                <button class="clear-btn" data-card-id="${cardId}">Clear Section</button>
                <div id="${cardId}-status" class="upload-status"></div>
            </div>
        `;
        
        // Insert before the placeholder
        container.insertBefore(card, placeholder);
        this.uploadCards.push(cardId);
        
        // Hide placeholder if max cards reached
        if (this.uploadCards.length >= this.maxCards) {
            placeholder.style.display = 'none';
        }
        
        // Populate dropdowns
        this.populateProductTypes(cardId);
        this.populateDocumentTypes(cardId);
        this.populateVersions(cardId);
        
        // Setup event listeners for this card
        this.setupCardListeners(cardId);
    }

    populateProductTypes(cardId) {
        const productTypeSelect = document.getElementById(`${cardId}-productType`);
        if (!productTypeSelect || !this.documentData) return;
        
        this.documentData.productTypes.forEach(product => {
            const option = document.createElement('option');
            option.value = product.name;
            option.textContent = product.name;
            productTypeSelect.appendChild(option);
        });
    }

    populateDocumentTypes(cardId) {
        const documentTypeSelect = document.getElementById(`${cardId}-documentType`);
        if (!documentTypeSelect || !this.documentData) return;
        
        this.documentData.documentTypes.forEach(docType => {
            const option = document.createElement('option');
            option.value = docType;
            option.textContent = docType;
            documentTypeSelect.appendChild(option);
        });
    }

    populateVersions(cardId) {
        const versionSelect = document.getElementById(`${cardId}-version`);
        if (!versionSelect || !this.documentData) return;
        
        this.documentData.versions.forEach(version => {
            const option = document.createElement('option');
            option.value = version;
            option.textContent = version;
            versionSelect.appendChild(option);
        });
    }

    setupCardListeners(cardId) {
        // Get the card element
        const card = document.getElementById(cardId);
        if (!card) return;
        
        // Product Type change listener
        const productTypeSelect = document.getElementById(`${cardId}-productType`);
        const materialSelect = document.getElementById(`${cardId}-material`);
        
        productTypeSelect.addEventListener('change', (e) => {
            const productType = e.target.value;
            this.updateMaterials(cardId, productType);
        });
        
        // File upload button listener
        const fileUploadBtn = card.querySelector('.file-upload-btn');
        const fileInput = document.getElementById(`${cardId}-file`);
        
        fileUploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', () => {
            const fileName = fileInput.files[0] ? fileInput.files[0].name : 'No file selected';
            const fileNameDiv = document.getElementById(`${cardId}-filename`);
            fileNameDiv.textContent = fileName;
        });
        
        // Clear button listener
        const clearBtn = card.querySelector('.clear-btn');
        clearBtn.addEventListener('click', () => {
            this.clearCard(cardId);
        });
        
        // Remove card button listener
        const removeBtn = card.querySelector('.remove-card-btn');
        removeBtn.addEventListener('click', () => {
            this.removeUploadCard(cardId);
        });
    }

    updateMaterials(cardId, productType) {
        const materialSelect = document.getElementById(`${cardId}-material`);
        materialSelect.innerHTML = '<option value="">Select Material Type</option>';
        materialSelect.disabled = true;
        
        if (!productType || !this.documentData) return;
        
        const productData = this.documentData.productTypes.find(p => p.name === productType);
        if (productData && productData.materials) {
            // Flatten all material types into a single list
            const allTypes = [];
            productData.materials.forEach(material => {
                if (material.types) {
                    material.types.forEach(type => {
                        allTypes.push(`${material.name} - ${type}`);
                    });
                }
            });
            
            allTypes.forEach(materialType => {
                const option = document.createElement('option');
                option.value = materialType;
                option.textContent = materialType;
                materialSelect.appendChild(option);
            });
            materialSelect.disabled = false;
        }
    }

    clearCard(cardId) {
        // Reset all form fields
        const fileInput = document.getElementById(`${cardId}-file`);
        const productTypeSelect = document.getElementById(`${cardId}-productType`);
        const materialSelect = document.getElementById(`${cardId}-material`);
        const typeSelect = document.getElementById(`${cardId}-type`);
        const documentTypeSelect = document.getElementById(`${cardId}-documentType`);
        const versionSelect = document.getElementById(`${cardId}-version`);
        const statusDiv = document.getElementById(`${cardId}-status`);
        
        if (fileInput) {
            fileInput.value = '';
            const fileNameDiv = document.getElementById(`${cardId}-filename`);
            if (fileNameDiv) fileNameDiv.textContent = 'No file selected';
        }
        if (productTypeSelect) productTypeSelect.value = '';
        if (materialSelect) {
            materialSelect.innerHTML = '<option value="">Select Material Type</option>';
            materialSelect.disabled = true;
        }
        if (documentTypeSelect) documentTypeSelect.value = '';
        if (versionSelect) versionSelect.value = '';
        if (statusDiv) statusDiv.textContent = '';
    }

    removeUploadCard(cardId) {
        const card = document.getElementById(cardId);
        if (card) {
            card.remove();
            this.uploadCards = this.uploadCards.filter(id => id !== cardId);
            
            // Show placeholder if below max cards
            const container = document.getElementById('uploadCardsContainer');
            const placeholder = container.querySelector('.add-card-placeholder');
            if (this.uploadCards.length < this.maxCards && placeholder) {
                placeholder.style.display = 'flex';
            }
        }
    }

    handleSubmitAndExtract() {
        // Collect data from all cards
        const allData = [];
        let hasErrors = false;

        this.uploadCards.forEach(cardId => {
            const fileInput = document.getElementById(`${cardId}-file`);
            const productTypeSelect = document.getElementById(`${cardId}-productType`);
            const materialSelect = document.getElementById(`${cardId}-material`);
            const documentTypeSelect = document.getElementById(`${cardId}-documentType`);
            const versionSelect = document.getElementById(`${cardId}-version`);
            const statusDiv = document.getElementById(`${cardId}-status`);

            const file = fileInput.files[0];
            const productType = productTypeSelect.value;
            const material = materialSelect.value;
            const documentType = documentTypeSelect.value;
            const version = versionSelect.value;

            if (!file || !productType || !material || !documentType || !version) {
                statusDiv.textContent = 'Please complete all fields.';
                statusDiv.style.color = 'red';
                hasErrors = true;
            } else {
                statusDiv.textContent = '';
                allData.push({
                    file: file.name,
                    productType: productType,
                    materialType: material,
                    documentType: documentType,
                    version: version
                });
            }
        });

        if (!hasErrors && allData.length > 0) {
            console.log('Submitting and extracting:', allData);
            alert(`Submitting and extracting ${allData.length} document(s):\n${allData.map(d => `${d.file} - ${d.productType}/${d.materialType} (${d.documentType} v${d.version})`).join('\n')}`);
            // Here you would typically send the data to your backend
        } else if (allData.length === 0) {
            alert('Please add at least one document before submitting.');
        }
    }

    onPageShow() {
        // Called when page becomes active
    }

    onPageHide() {
        // Called when page becomes inactive
    }
}
