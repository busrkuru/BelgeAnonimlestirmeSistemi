from cryptography.fernet import Fernet

def generate_key():
    key = Fernet.generate_key()
    with open("aes_key.key", "wb") as key_file:
        key_file.write(key)

def load_key():
    with open("aes_key.key", "rb") as key_file:
        return key_file.read()

# Eğer aes_key.key dosyası yoksa bu kodu çalıştırarak oluşturun
try:
    load_key()
except FileNotFoundError:
    generate_key()

fernet = Fernet(load_key())

def encrypt_text(text):
    encrypted_text = fernet.encrypt(text.encode())
    return encrypted_text.decode()

def decrypt_text(encrypted_text):
    decrypted_text = fernet.decrypt(encrypted_text.encode())
    return decrypted_text.decode()