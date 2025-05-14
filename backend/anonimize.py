import sys
import os
import json
import spacy
import fitz  # PyMuPDF
import re
import io
from PIL import Image, ImageFilter
import datetime

nlp = spacy.load("en_core_web_sm")

# E-posta ve telefon numarası için regexler
email_regex = r'[\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,}'
##phone_regex = r'(\+?\d{1,3})?[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}'
phone_regex = r'(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}'

# Bölüm başlıkları - Bunlardan sonra gelen kısımlar anonimleştirilmemeli
skip_sections = ["Giriş", "İlgili çalışmalar", "Referanslar", "Teşekkür"]

encrypted_data = {}

def extract_text_from_pdf(file_path):
    text = ""
    with fitz.open(file_path) as doc:
        for page in doc:
            text += page.get_text()
    return text

def should_anonymize(text):
    for section in skip_sections:
        if section.lower() in text.lower():
            return False
    return True

def blur_image(image_stream):
    image = Image.open(image_stream)
    blurred_image = image.filter(ImageFilter.GaussianBlur(radius=10))  # Blur seviyesi
    output_stream = io.BytesIO()
    blurred_image.save(output_stream, format="PNG")
    return output_stream.getvalue()

def anonymize_pdf(file_path, anonimBilgiler):
    doc = fitz.open(file_path)
    text = extract_text_from_pdf(file_path)

    for page_num, page in enumerate(doc):
        page_text = page.get_text()
        page_doc = nlp(page_text)

        if should_anonymize(page_text):
            for ent in page_doc.ents:
                if ((ent.label_ == "PERSON" and "yazar" in anonimBilgiler) or
                    (ent.label_ == "ORG" and "kurum" in anonimBilgiler) or
                    (ent.label_ == "EMAIL" and "email" in anonimBilgiler) or
                    (ent.label_ == "GPE" and "kurum" in anonimBilgiler)):

                    rects = page.search_for(ent.text)
                    for rect in rects:
                        page.add_redact_annot(rect, fill=(0, 0, 0))
                        encrypted_data[ent.text] = ent.label_

            # E-posta ve telefon numarası bulanıklaştırma
            for match in re.finditer(email_regex, page_text):
                rects = page.search_for(match.group())
                for rect in rects:
                    page.add_redact_annot(rect, fill=(0, 0, 0))
                    encrypted_data[match.group()] = "EMAIL"

            for match in re.finditer(phone_regex, page_text):
                rects = page.search_for(match.group())
                for rect in rects:
                    page.add_redact_annot(rect, fill=(0, 0, 0))
                    encrypted_data[match.group()] = "PHONE"

            # Resimleri bulanıklaştırma işlemi
            images = page.get_images(full=True)
            for img_index, img in enumerate(images):
                xref = img[0]
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_stream = io.BytesIO(image_bytes)
                
                # Blur işlemini uygulama
                blurred_image_data = blur_image(image_stream)
                
                # Görselin bulunduğu alanı belirleme
                img_rects = page.get_image_rects(xref)
                if img_rects:
                    rect = img_rects[0]
                    # Blur yapılmış görüntüyü sayfaya yerleştir
                    page.insert_image(rect, stream=blurred_image_data)

        page.apply_redactions()

    # Dosyaları benzersiz isimlerle kaydetme
    output_folder = "backend/anonimized"
    os.makedirs(output_folder, exist_ok=True)

    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    output_pdf_path = os.path.join(output_folder, f"anonim_{timestamp}_{os.path.basename(file_path)}")
    output_json_path = os.path.join(output_folder, f"anonimized_data_{timestamp}.json")

    doc.save(output_pdf_path)
    doc.close()
    
    with open(output_json_path, "w") as json_file:
        json.dump(encrypted_data, json_file, indent=4)
    
    return output_pdf_path

if __name__ == "__main__":
    dosya_adi = sys.argv[1]
    anonimBilgiler = sys.argv[2:]

    file_path = os.path.join("uploads", dosya_adi)
    anonymized_pdf = anonymize_pdf(file_path, anonimBilgiler)

    sonuc = {"anonymized_pdf_path": anonymized_pdf}
    print(json.dumps(sonuc))
