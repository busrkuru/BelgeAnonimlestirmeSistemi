import sys
import json
import spacy

nlp = spacy.load("en_core_web_sm")

def extract_entities(text):
    doc = nlp(text)
    persons = list(set(ent.text for ent in doc.ents if ent.label_ == "PERSON"))
    orgs = list(set(ent.text for ent in doc.ents if ent.label_ == "ORG"))
    return {"yazarlar": persons, "kurumlar": orgs}

if __name__ == "__main__":
    input_text = sys.stdin.read()
    result = extract_entities(input_text)
    print(json.dumps(result))