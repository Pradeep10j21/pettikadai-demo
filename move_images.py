import shutil
import os

dest_dir = r'c:\Users\Kushhal S\OneDrive\Desktop\Pettikadai\public\images'
os.makedirs(dest_dir, exist_ok=True)

images = {
    r'C:\Users\Kushhal S\.gemini\antigravity\brain\3a409476-5c96-44a9-a49b-66c79b80d4e3\kaaram_assortment_1773610512165.png': 'kaaram.png',
    r'C:\Users\Kushhal S\.gemini\antigravity\brain\3a409476-5c96-44a9-a49b-66c79b80d4e3\sweet_assortment_1773610752886.png': 'sweet.png',
    r'C:\Users\Kushhal S\.gemini\antigravity\brain\3a409476-5c96-44a9-a49b-66c79b80d4e3\butter_murukku_hero_1773610774433.png': 'butter_murukku.png',
    r'C:\Users\Kushhal S\.gemini\antigravity\brain\3a409476-5c96-44a9-a49b-66c79b80d4e3\madras_mixture_hero_1773610791284.png': 'mixture.png'
}

for src, name in images.items():
    dest = os.path.join(dest_dir, name)
    try:
        shutil.copy(src, dest)
        print(f"Copied {name}")
    except Exception as e:
        print(f"Error copying {name}: {e}")
