import type { ItemDefinition, ItemLibraryCategory, ChecklistItem, PackingItem } from '@/types';

export const ITEM_LIBRARY: Record<string, ItemDefinition> = {
    // Dokumenty i Finanse
    doc_passport: { id: 'doc_passport', name: 'Paszport', category: 'Dokumenty i Finanse', defaultQty: '1', tags: ['essential', 'documents', 'international'], relevance: 10, notes: 'Sprawdź datę ważności!' },
    doc_id: { id: 'doc_id', name: 'Dowód osobisty', category: 'Dokumenty i Finanse', defaultQty: '1', tags: ['essential', 'documents'], relevance: 10 },
    doc_drivers_license: { id: 'doc_drivers_license', name: 'Prawo jazdy', category: 'Dokumenty i Finanse', defaultQty: '1', tags: ['documents', 'car'], relevance: 7 },
    doc_visa: { id: 'doc_visa', name: 'Wiza', category: 'Dokumenty i Finanse', defaultQty: '1', tags: ['documents', 'international'], relevance: 10, notes: 'Jeśli wymagana' },
    doc_insurance_card: { id: 'doc_insurance_card', name: 'Karta ubezpieczenia (EKUZ)', category: 'Dokumenty i Finanse', defaultQty: '1', tags: ['documents', 'health', 'essential'], relevance: 9 },
    doc_copies: { id: 'doc_copies', name: 'Kopia dokumentów', category: 'Dokumenty i Finanse', defaultQty: '1', tags: ['documents', 'safety'], relevance: 7, notes: 'Przechowuj osobno od oryginałów' },
    fin_credit_card: { id: 'fin_credit_card', name: 'Karta kredytowa/debetowa', category: 'Dokumenty i Finanse', defaultQty: '1-2', tags: ['essential', 'finance'], relevance: 10 },
    fin_cash: { id: 'fin_cash', name: 'Gotówka (lokalna waluta)', category: 'Dokumenty i Finanse', defaultQty: 'Trochę', tags: ['essential', 'finance'], relevance: 8 },
    doc_tickets: { id: 'doc_tickets', name: 'Bilety (lotnicze/kolejowe)', category: 'Dokumenty i Finanse', defaultQty: '1', tags: ['essential', 'documents', 'travel_basics'], relevance: 9, notes: 'Wersja cyfrowa i/lub papierowa' },
    doc_hotel_confirmation: { id: 'doc_hotel_confirmation', name: 'Potwierdzenie rezerwacji', category: 'Dokumenty i Finanse', defaultQty: '1', tags: ['documents', 'travel_basics'], relevance: 8 },

    // Elektronika
    elec_phone: { id: 'elec_phone', name: 'Telefon', category: 'Elektronika', defaultQty: '1', tags: ['essential', 'electronics'], relevance: 10 },
    elec_phone_charger: { id: 'elec_phone_charger', name: 'Ładowarka do telefonu', category: 'Elektronika', defaultQty: '1', tags: ['essential', 'electronics'], relevance: 10 },
    elec_powerbank: { id: 'elec_powerbank', name: 'Power bank', category: 'Elektronika', defaultQty: '1', tags: ['essential', 'electronics', 'travel_basics'], relevance: 9 },
    elec_headphones: { id: 'elec_headphones', name: 'Słuchawki', category: 'Elektronika', defaultQty: '1', tags: ['electronics', 'entertainment', 'comfort'], relevance: 8 },
    elec_adapter: { id: 'elec_adapter', name: 'Adapter do gniazdka', category: 'Elektronika', defaultQty: '1', tags: ['electronics', 'international'], relevance: 9, notes: 'Sprawdź typ dla kraju docelowego' },
    elec_laptop: { id: 'elec_laptop', name: 'Laptop', category: 'Elektronika', defaultQty: '1', tags: ['electronics', 'work'], relevance: 6 },
    elec_laptop_charger: { id: 'elec_laptop_charger', name: 'Ładowarka do laptopa', category: 'Elektronika', defaultQty: '1', tags: ['electronics', 'work'], relevance: 6 },
    elec_camera: { id: 'elec_camera', name: 'Aparat fotograficzny', category: 'Elektronika', defaultQty: '1', tags: ['electronics', 'hobby', 'photography'], relevance: 5 },
    elec_camera_charger: { id: 'elec_camera_charger', name: 'Ładowarka do aparatu', category: 'Elektronika', defaultQty: '1', tags: ['electronics', 'hobby', 'photography'], relevance: 5 },
    elec_sd_card: { id: 'elec_sd_card', name: 'Dodatkowa karta pamięci', category: 'Elektronika', defaultQty: '1', tags: ['electronics', 'hobby', 'photography'], relevance: 4 },
    elec_ebook_reader: { id: 'elec_ebook_reader', name: 'Czytnik e-booków', category: 'Elektronika', defaultQty: '1', tags: ['electronics', 'entertainment'], relevance: 5 },
    elec_speaker: { id: 'elec_speaker', name: 'Głośnik przenośny', category: 'Elektronika', defaultQty: '1', tags: ['electronics', 'entertainment'], relevance: 4 },

    // Higiena i Kosmetyki
    hyg_toothbrush: { id: 'hyg_toothbrush', name: 'Szczoteczka do zębów', category: 'Higiena i Kosmetyki', defaultQty: '1', tags: ['essential', 'hygiene'], relevance: 10 },
    hyg_toothpaste: { id: 'hyg_toothpaste', name: 'Pasta do zębów', category: 'Higiena i Kosmetyki', defaultQty: '1', tags: ['essential', 'hygiene'], relevance: 10 },
    hyg_shower_gel: { id: 'hyg_shower_gel', name: 'Żel pod prysznic', category: 'Higiena i Kosmetyki', defaultQty: '1', tags: ['hygiene'], relevance: 8, notes: 'Wersja podróżna lub kup na miejscu' },
    hyg_shampoo: { id: 'hyg_shampoo', name: 'Szampon', category: 'Higiena i Kosmetyki', defaultQty: '1', tags: ['hygiene'], relevance: 8, notes: 'Wersja podróżna' },
    hyg_conditioner: { id: 'hyg_conditioner', name: 'Odżywka do włosów', category: 'Higiena i Kosmetyki', defaultQty: '1', tags: ['hygiene'], relevance: 6, notes: 'Wersja podróżna' },
    hyg_deodorant: { id: 'hyg_deodorant', name: 'Dezodorant', category: 'Higiena i Kosmetyki', defaultQty: '1', tags: ['essential', 'hygiene'], relevance: 9 },
    hyg_sunscreen: { id: 'hyg_sunscreen', name: 'Krem z filtrem UV', category: 'Higiena i Kosmetyki', defaultQty: '1', tags: ['hygiene', 'sun', 'beach', 'summer'], relevance: 9 },
    hyg_hairbrush: { id: 'hyg_hairbrush', name: 'Szczotka/grzebień do włosów', category: 'Higiena i Kosmetyki', defaultQty: '1', tags: ['hygiene'], relevance: 7 },
    hyg_moisturizer: { id: 'hyg_moisturizer', name: 'Krem nawilżający', category: 'Higiena i Kosmetyki', defaultQty: '1', tags: ['hygiene'], relevance: 6 },
    hyg_lip_balm: { id: 'hyg_lip_balm', name: 'Balsam do ust', category: 'Higiena i Kosmetyki', defaultQty: '1', tags: ['hygiene', 'sun', 'winter'], relevance: 7 },
    hyg_face_wash: { id: 'hyg_face_wash', name: 'Żel do mycia twarzy', category: 'Higiena i Kosmetyki', defaultQty: '1', tags: ['hygiene'], relevance: 7 },
    hyg_makeup: { id: 'hyg_makeup', name: 'Kosmetyki do makijażu', category: 'Higiena i Kosmetyki', defaultQty: 'Zestaw', tags: ['hygiene', 'cosmetics'], relevance: 5 },
    hyg_makeup_remover: { id: 'hyg_makeup_remover', name: 'Płyn do demakijażu', category: 'Higiena i Kosmetyki', defaultQty: '1', tags: ['hygiene', 'cosmetics'], relevance: 5 },
    hyg_razor: { id: 'hyg_razor', name: 'Maszynka do golenia', category: 'Higiena i Kosmetyki', defaultQty: '1', tags: ['hygiene'], relevance: 6 },
    hyg_hand_sanitizer: { id: 'hyg_hand_sanitizer', name: 'Żel antybakteryjny', category: 'Higiena i Kosmetyki', defaultQty: '1', tags: ['hygiene', 'health'], relevance: 8 },
    hyg_floss: { id: 'hyg_floss', name: 'Nić dentystyczna', category: 'Higiena i Kosmetyki', defaultQty: '1', tags: ['hygiene'], relevance: 6 },
    hyg_nail_clippers: { id: 'hyg_nail_clippers', name: 'Obcinacz do paznokci', category: 'Higiena i Kosmetyki', defaultQty: '1', tags: ['hygiene'], relevance: 5 },
    hyg_tweezers: { id: 'hyg_tweezers', name: 'Pęseta', category: 'Higiena i Kosmetyki', defaultQty: '1', tags: ['hygiene'], relevance: 4 },
    hyg_contacts: { id: 'hyg_contacts', name: 'Soczewki i płyn', category: 'Higiena i Kosmetyki', defaultQty: 'Zapas', tags: ['hygiene', 'health'], relevance: 8 },

    // Apteczka
    aid_painkillers: { id: 'aid_painkillers', name: 'Leki przeciwbólowe', category: 'Apteczka', defaultQty: '1 op.', tags: ['essential', 'health'], relevance: 9 },
    aid_plasters: { id: 'aid_plasters', name: 'Plastry', category: 'Apteczka', defaultQty: 'Zestaw', tags: ['essential', 'health'], relevance: 8 },
    aid_disinfectant: { id: 'aid_disinfectant', name: 'Środek do dezynfekcji', category: 'Apteczka', defaultQty: '1', tags: ['essential', 'health'], relevance: 8 },
    aid_stomach: { id: 'aid_stomach', name: 'Leki na problemy żołądkowe', category: 'Apteczka', defaultQty: '1 op.', tags: ['health'], relevance: 8 },
    aid_personal_meds: { id: 'aid_personal_meds', name: 'Leki osobiste', category: 'Apteczka', defaultQty: 'Zapas', tags: ['essential', 'health'], relevance: 10, notes: 'Weź więcej niż potrzeba' },
    aid_allergy: { id: 'aid_allergy', name: 'Leki na alergię', category: 'Apteczka', defaultQty: '1 op.', tags: ['health'], relevance: 7 },
    aid_insect_repellent: { id: 'aid_insect_repellent', name: 'Repelent na owady', category: 'Apteczka', defaultQty: '1', tags: ['health', 'summer', 'tropics'], relevance: 8 },
    aid_motion_sickness: { id: 'aid_motion_sickness', name: 'Leki na chorobę lokomocyjną', category: 'Apteczka', defaultQty: '1 op.', tags: ['health', 'travel_basics'], relevance: 7 },
    aid_blister_plasters: { id: 'aid_blister_plasters', name: 'Plastry na pęcherze', category: 'Apteczka', defaultQty: '1 op.', tags: ['health', 'hiking'], relevance: 8 },

    // Ubrania
    cloth_underwear: { id: 'cloth_underwear', name: 'Bielizna', category: 'Ubrania', defaultQty: 'dni + 2', tags: ['essential', 'clothing'], relevance: 10 },
    cloth_socks: { id: 'cloth_socks', name: 'Skarpetki', category: 'Ubrania', defaultQty: 'dni + 1', tags: ['essential', 'clothing'], relevance: 10 },
    cloth_tshirt: { id: 'cloth_tshirt', name: 'T-shirt / Koszulka', category: 'Ubrania', defaultQty: 'Na każdy dzień', tags: ['clothing'], relevance: 9 },
    cloth_trousers: { id: 'cloth_trousers', name: 'Spodnie', category: 'Ubrania', defaultQty: '1-2', tags: ['clothing'], relevance: 8 },
    cloth_sweater: { id: 'cloth_sweater', name: 'Bluza / Sweter', category: 'Ubrania', defaultQty: '1-2', tags: ['clothing', 'winter', 'spring', 'autumn'], relevance: 8 },
    cloth_jacket: { id: 'cloth_jacket', name: 'Kurtka', category: 'Ubrania', defaultQty: '1', tags: ['clothing', 'winter', 'spring', 'autumn'], relevance: 9, notes: 'Dostosuj do pogody' },
    cloth_rain_jacket: { id: 'cloth_rain_jacket', name: 'Kurtka przeciwdeszczowa', category: 'Ubrania', defaultQty: '1', tags: ['clothing', 'rain', 'hiking'], relevance: 8 },
    cloth_pyjamas: { id: 'cloth_pyjamas', name: 'Piżama', category: 'Ubrania', defaultQty: '1', tags: ['clothing'], relevance: 7 },
    cloth_shorts: { id: 'cloth_shorts', name: 'Krótkie spodenki', category: 'Ubrania', defaultQty: '1-2', tags: ['clothing', 'summer', 'beach'], relevance: 8 },
    cloth_swimsuit: { id: 'cloth_swimsuit', name: 'Strój kąpielowy', category: 'Ubrania', defaultQty: '1-2', tags: ['clothing', 'summer', 'beach', 'swimming'], relevance: 8 },
    cloth_elegant_outfit: { id: 'cloth_elegant_outfit', name: 'Elegancki strój', category: 'Ubrania', defaultQty: '1', tags: ['clothing', 'event', 'elegant'], relevance: 6, notes: 'Np. koszula, sukienka' },
    cloth_hat: { id: 'cloth_hat', name: 'Czapka / Kapelusz', category: 'Ubrania', defaultQty: '1', tags: ['clothing', 'sun', 'winter'], relevance: 7 },
    cloth_gloves: { id: 'cloth_gloves', name: 'Rękawiczki', category: 'Ubrania', defaultQty: '1', tags: ['clothing', 'winter'], relevance: 7 },
    cloth_scarf: { id: 'cloth_scarf', name: 'Szalik / Apasszka', category: 'Ubrania', defaultQty: '1', tags: ['clothing', 'winter'], relevance: 6 },
    cloth_thermals: { id: 'cloth_thermals', name: 'Bielizna termiczna', category: 'Ubrania', defaultQty: '1', tags: ['clothing', 'winter', 'hiking'], relevance: 8 },

    // Obuwie
    shoe_sneakers: { id: 'shoe_sneakers', name: 'Wygodne buty (sneakersy)', category: 'Obuwie', defaultQty: '1', tags: ['essential', 'shoes'], relevance: 10 },
    shoe_sandals: { id: 'shoe_sandals', name: 'Sandały', category: 'Obuwie', defaultQty: '1', tags: ['shoes', 'summer', 'beach'], relevance: 7 },
    shoe_flipflops: { id: 'shoe_flipflops', name: 'Klapki', category: 'Obuwie', defaultQty: '1', tags: ['shoes', 'summer', 'beach', 'pool'], relevance: 7 },
    shoe_elegant: { id: 'shoe_elegant', name: 'Eleganckie buty', category: 'Obuwie', defaultQty: '1', tags: ['shoes', 'business', 'event'], relevance: 5 },
    shoe_hiking: { id: 'shoe_hiking', name: 'Buty trekkingowe', category: 'Obuwie', defaultQty: '1', tags: ['shoes', 'hiking', 'mountains'], relevance: 8 },
    shoe_water_shoes: { id: 'shoe_water_shoes', name: 'Buty do wody', category: 'Obuwie', defaultQty: '1', tags: ['shoes', 'beach', 'water_sports'], relevance: 6 },
    shoe_slippers: { id: 'shoe_slippers', name: 'Kapcie', category: 'Obuwie', defaultQty: '1', tags: ['shoes', 'comfort', 'hotel'], relevance: 5 },

    // Akcesoria i Inne
    acc_keys: { id: 'acc_keys', name: 'Klucze do domu', category: 'Inne', defaultQty: '1', tags: ['essential'], relevance: 10 },
    acc_book: { id: 'acc_book', name: 'Książka', category: 'Inne', defaultQty: '1', tags: ['entertainment'], relevance: 5 },
    acc_sunglasses: { id: 'acc_sunglasses', name: 'Okulary przeciwsłoneczne', category: 'Inne', defaultQty: '1', tags: ['sun', 'summer', 'winter', 'car'], relevance: 8 },
    acc_reusable_bag: { id: 'acc_reusable_bag', name: 'Torba wielorazowa', category: 'Inne', defaultQty: '1', tags: ['eco', 'shopping'], relevance: 6 },
    acc_water_bottle: { id: 'acc_water_bottle', name: 'Butelka na wodę', category: 'Inne', defaultQty: '1', tags: ['eco', 'hiking', 'sports'], relevance: 7 },
    acc_travel_pillow: { id: 'acc_travel_pillow', name: 'Poduszka podróżna', category: 'W Podróży (Podręczne)', defaultQty: '1', tags: ['comfort', 'travel_basics'], relevance: 6 },
    acc_snacks: { id: 'acc_snacks', name: 'Przekąski', category: 'Inne', defaultQty: 'Zapas', tags: ['food'], relevance: 7 },
    acc_eye_mask: { id: 'acc_eye_mask', name: 'Maska na oczy', category: 'W Podróży (Podręczne)', defaultQty: '1', tags: ['comfort', 'sleep'], relevance: 6 },
    acc_earplugs: { id: 'acc_earplugs', name: 'Zatyczki do uszu', category: 'W Podróży (Podręczne)', defaultQty: '1', tags: ['comfort', 'sleep'], relevance: 6 },
    acc_luggage_lock: { id: 'acc_luggage_lock', name: 'Kłódka do bagażu', category: 'Inne', defaultQty: '1', tags: ['safety'], relevance: 7 },
    acc_laundry_bag: { id: 'acc_laundry_bag', name: 'Worek na brudne ubrania', category: 'Inne', defaultQty: '1', tags: ['organization'], relevance: 7 },
    acc_umbrella: { id: 'acc_umbrella', name: 'Parasol', category: 'Inne', defaultQty: '1', tags: ['rain'], relevance: 6 },
    acc_sewing_kit: { id: 'acc_sewing_kit', name: 'Mini zestaw do szycia', category: 'Inne', defaultQty: '1', tags: ['emergency'], relevance: 3 },
    acc_money_belt: { id: 'acc_money_belt', name: 'Pas na pieniądze', category: 'Inne', defaultQty: '1', tags: ['safety', 'international'], relevance: 7 },

    // Dzieci
    kid_diapers: { id: 'kid_diapers', name: 'Pieluchy', category: 'Dzieci', defaultQty: 'ok. 5/dzień', tags: ['kids', 'baby', 'essential'], relevance: 10, notes: 'Rozważ zakup na miejscu' },
    kid_wet_wipes: { id: 'kid_wet_wipes', name: 'Chusteczki nawilżane', category: 'Dzieci', defaultQty: 'Duża paczka', tags: ['kids', 'baby', 'essential'], relevance: 10 },
    kid_monitor: { id: 'kid_monitor', name: 'Niania elektroniczna', category: 'Dzieci', defaultQty: '1', tags: ['kids', 'baby'], relevance: 8 },
    kid_toys: { id: 'kid_toys', name: 'Ulubione zabawki', category: 'Dzieci', defaultQty: 'Kilka', tags: ['kids', 'entertainment'], relevance: 7 },
    kid_snacks: { id: 'kid_snacks', name: 'Przekąski dla dziecka', category: 'Dzieci', defaultQty: 'Zapas', tags: ['kids', 'food'], relevance: 9 },
    kid_games: { id: 'kid_games', name: 'Gry / Kolorowanki', category: 'Dzieci', defaultQty: 'Kilka', tags: ['kids', 'entertainment'], relevance: 6 },
    kid_stroller: { id: 'kid_stroller', name: 'Wózek dziecięcy', category: 'Dzieci', defaultQty: '1', tags: ['kids', 'baby', 'travel_basics'], relevance: 9 },
    kid_car_seat: { id: 'kid_car_seat', name: 'Fotelik samochodowy', category: 'Dzieci', defaultQty: '1', tags: ['kids', 'baby', 'car', 'safety'], relevance: 10 },
    kid_carrier: { id: 'kid_carrier', name: 'Nosidełko dla dziecka', category: 'Dzieci', defaultQty: '1', tags: ['kids', 'baby', 'hiking'], relevance: 8 },
    kid_bib: { id: 'kid_bib', name: 'Śliniak', category: 'Dzieci', defaultQty: '2-3', tags: ['kids', 'baby', 'food'], relevance: 8 },
    kid_formula: { id: 'kid_formula', name: 'Mleko modyfikowane', category: 'Dzieci', defaultQty: 'Zapas', tags: ['kids', 'baby', 'food', 'essential'], relevance: 10 },

    // Podróż z psem
    dog_food: { id: 'dog_food', name: 'Karma dla psa', category: 'Psy', defaultQty: 'Zapas', tags: ['pets', 'dog', 'essential'], relevance: 10 },
    dog_bowl: { id: 'dog_bowl', name: 'Miska na wodę i karmę', category: 'Psy', defaultQty: '1', tags: ['pets', 'dog', 'essential'], relevance: 9 },
    dog_leash: { id: 'dog_leash', name: 'Smycz i obroża/szelki', category: 'Psy', defaultQty: '1', tags: ['pets', 'dog', 'essential'], relevance: 10 },
    dog_passport: { id: 'dog_passport', name: 'Paszport/książeczka zdrowia psa', category: 'Psy', defaultQty: '1', tags: ['pets', 'dog', 'documents'], relevance: 10 },
    dog_poo_bags: { id: 'dog_poo_bags', name: 'Woreczki na odchody', category: 'Psy', defaultQty: 'Zapas', tags: ['pets', 'dog', 'hygiene'], relevance: 9 },
};

export const ITEM_LIBRARY_CATEGORIES: ItemLibraryCategory[] = [
    {
        title: "Niezbędnik Podróżnika",
        itemIds: ['doc_passport', 'doc_id', 'fin_credit_card', 'fin_cash', 'doc_tickets', 'elec_phone', 'acc_keys', 'doc_insurance_card'],
    },
    {
        title: "Elektronika i Gadżety",
        itemIds: ['elec_phone_charger', 'elec_powerbank', 'elec_headphones', 'elec_adapter', 'elec_ebook_reader', 'elec_speaker'],
    },
    {
        title: "Higiena i Pielęgnacja",
        itemIds: ['hyg_toothbrush', 'hyg_toothpaste', 'hyg_shower_gel', 'hyg_shampoo', 'hyg_deodorant', 'hyg_hairbrush', 'hyg_hand_sanitizer', 'hyg_razor', 'hyg_contacts'],
    },
    {
        title: "Apteczka Podróżna",
        itemIds: ['aid_painkillers', 'aid_plasters', 'aid_disinfectant', 'aid_stomach', 'aid_personal_meds', 'aid_insect_repellent', 'aid_motion_sickness', 'aid_blister_plasters'],
    },
    {
        title: "Ubrania",
        itemIds: ['cloth_underwear', 'cloth_socks', 'cloth_tshirt', 'cloth_sweater', 'cloth_trousers', 'cloth_shorts', 'cloth_pyjamas'],
    },
    {
        title: "Obuwie",
        itemIds: ['shoe_sneakers', 'shoe_sandals', 'shoe_flipflops', 'shoe_slippers'],
    },
    {
        title: "Komfort i Sen",
        itemIds: ['acc_travel_pillow', 'elec_headphones', 'acc_book', 'acc_eye_mask', 'acc_earplugs'],
    },
    {
        title: "Organizacja i Bezpieczeństwo",
        itemIds: ['acc_reusable_bag', 'acc_laundry_bag', 'acc_luggage_lock', 'acc_money_belt', 'doc_copies'],
    },
    {
        title: "Akcesoria Plażowe i Letnie",
        itemIds: ['cloth_swimsuit', 'hyg_sunscreen', 'acc_sunglasses', 'shoe_sandals', 'cloth_hat', 'shoe_water_shoes'],
    },
    {
        title: "Ekwipunek na Chłody i Zimę",
        itemIds: ['cloth_jacket', 'cloth_thermals', 'cloth_gloves', 'cloth_scarf', 'cloth_hat', 'hyg_lip_balm'],
    },
    {
        title: "Podróż z Niemowlakiem (0-2 lata)",
        itemIds: ['kid_diapers', 'kid_wet_wipes', 'kid_monitor', 'kid_formula', 'kid_bib', 'kid_carrier', 'kid_stroller'],
    },
     {
        title: "Podróż z Dzieckiem (2+ lata)",
        itemIds: ['kid_games', 'kid_snacks', 'aid_plasters', 'hyg_sunscreen', 'kid_toys'],
    },
    {
        title: "Podróż z psem",
        itemIds: ['dog_food', 'dog_bowl', 'dog_leash', 'dog_passport', 'dog_poo_bags'],
    },
    {
        title: "Praca zdalna",
        itemIds: ['elec_laptop', 'elec_laptop_charger', 'elec_headphones'],
    },
    {
        title: "Sprzęt fotograficzny",
        itemIds: ['elec_camera', 'elec_camera_charger', 'elec_sd_card'],
    },
    {
        title: "Wędrówka / Trekking",
        itemIds: ['shoe_hiking', 'acc_water_bottle', 'aid_blister_plasters', 'cloth_rain_jacket'],
    },
    {
        title: "Eleganckie wyjście",
        itemIds: ['cloth_elegant_outfit', 'shoe_elegant'],
    },
    {
        title: "Do Samochodu",
        itemIds: ['doc_drivers_license', 'elec_phone_charger', 'acc_sunglasses', 'kid_car_seat'],
    },
];

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  { id: 401, task: 'Naładować power bank', done: false },
  { id: 402, task: 'Spakować ładowarkę do power banku', done: false },
  { id: 403, task: 'Spakować prezenty', done: false },
  { id: 404, task: 'Wyrzucić śmieci', done: false },
  { id: 405, task: 'Uruchomić zmywarkę', done: false },
  { id: 406, task: 'Opróżnić lodówkę z psujących się rzeczy', done: false },
  { id: 407, task: 'Zamknąć okna', done: false },
  { id: 408, task: 'Ustawić alarm', done: false },
  { id: 409, task: 'Ustawić piec na tryb eko/wakacyjny', done: false },
  { id: 410, task: 'Zmniejszyć temperaturę ogrzewania', done: false },
  { id: 411, task: 'Opróżnić nawilżacz powietrza', done: false },
  { id: 412, task: 'Wylać wodę z czajnika i dzbanka', done: false },
  { id: 413, task: 'Wylać wodę z ekspresu do kawy', done: false },
];

// Converted to the new flat structure
export const DEFAULT_PACKING_LIST: PackingItem[] = [
  { "id": 1, "name": "Leki na sraczke", "qty": "1", "category": "Apteczka", "packed": false },
  { "id": 2, "name": "Sól fizjologiczna", "qty": "1", "category": "Apteczka", "packed": false },
  { "id": 3, "name": "Sól morska do nosa", "qty": "1", "category": "Apteczka", "packed": false },
  { "id": 4, "name": "Plastry na skaleczenia", "qty": "1 zestaw", "category": "Apteczka", "packed": false },
  { "id": 5, "name": "Plastry na blizne", "qty": "1", "category": "Apteczka", "packed": false },
  { "id": 6, "name": "Waciki dezynfekujące", "qty": "1 op.", "category": "Apteczka", "packed": false },
  { "id": 7, "name": "Octanisept", "qty": "1", "category": "Apteczka", "packed": false },
  { "id": 8, "name": "Leki przeciwgorączkowe", "qty": "1", "category": "Apteczka", "packed": false },
  { "id": 9, "name": "Aromactiv", "qty": "2", "category": "Apteczka", "packed": false },
  { "id": 10, "name": "Probiotyki", "qty": "1", "category": "Apteczka", "packed": false },
  { "id": 11, "name": "Penthanol na oparzenia", "qty": "1", "category": "Apteczka", "packed": false },
  { "id": 12, "name": "Bepanthen", "qty": "1", "category": "Apteczka", "packed": false },
  { "id": 13, "name": "Nożyczki do blizny", "qty": "1", "category": "Apteczka", "packed": false },
  { "id": 14, "name": "Paszporty", "qty": "Wg potrzeb", "category": "Dokumenty i Finanse", "packed": false },
  { "id": 15, "name": "Portfele", "qty": "Wg potrzeb", "category": "Dokumenty i Finanse", "packed": false },
  { "id": 16, "name": "Euro", "qty": "Wg potrzeb", "category": "Dokumenty i Finanse", "packed": false },
  { "id": 17, "name": "Bilety lotnicze", "qty": "Wg potrzeb", "category": "Dokumenty i Finanse", "packed": false },
  { "id": 18, "name": "Duszek i krakacz", "qty": "1", "category": "Dzieci", "packed": false },
  { "id": 19, "name": "Deska dla julki", "qty": "1", "category": "Dzieci", "packed": false },
  { "id": 20, "name": "Makaron do pluwania", "qty": "1", "category": "Dzieci", "packed": false },
  { "id": 21, "name": "Koc dla Julki", "qty": "1", "category": "Dzieci", "packed": false, "notes": "Do leżenia w pokoju" },
  { "id": 22, "name": "Wiaderko i foremki do piasku", "qty": "1 zestaw", "category": "Dzieci", "packed": false },
  { "id": 23, "name": "Zabawki do samolotu", "qty": "Kilka", "category": "Dzieci", "packed": false },
  { "id": 24, "name": "Puzzle", "qty": "1", "category": "Dzieci", "packed": false },
  { "id": 25, "name": "Zabawki dla julki", "qty": "Kilka", "category": "Dzieci", "packed": false },
  { "id": 26, "name": "Pampersy do plywania", "qty": "1 op.", "category": "Dzieci", "packed": false },
  { "id": 27, "name": "Pampersy zwykle", "qty": "Zapas", "category": "Dzieci", "packed": false },
  { "id": 28, "name": "Chusteczki nawilzajace", "qty": "1 op.", "category": "Dzieci", "packed": false },
  { "id": 29, "name": "Ręczniki dla dziewczyn", "qty": "2", "category": "Dzieci", "packed": false },
  { "id": 30, "name": "Pieluchy tetrowe", "qty": "Kilka", "category": "Dzieci", "packed": false },
  { "id": 31, "name": "Wózek", "qty": "1", "category": "Dzieci", "packed": false },
  { "id": 32, "name": "Chusta", "qty": "1", "category": "Dzieci", "packed": false },
  { "id": 33, "name": "Lampka nocna", "qty": "2", "category": "Dzieci", "packed": false },
  { "id": 34, "name": "Niania", "qty": "2", "category": "Dzieci", "packed": false },
  { "id": 35, "name": "Ładowarki do telefonów", "qty": "2", "category": "Elektronika", "packed": false },
  { "id": 36, "name": "Ładowarka do zegarka", "qty": "1", "category": "Elektronika", "packed": false },
  { "id": 37, "name": "Telefony", "qty": "2", "category": "Elektronika", "packed": false },
  { "id": 38, "name": "Kamerka go pro + ladowarka", "qty": "1", "category": "Elektronika", "packed": false },
  { "id": 39, "name": "Waciki i patyczki do uszu", "qty": "1 op.", "category": "Higiena i Kosmetyki", "packed": false },
  { "id": 40, "name": "Szczoteczki do zębów", "qty": "Wg potrzeb", "category": "Higiena i Kosmetyki", "packed": false },
  { "id": 41, "name": "Pasty do zębów", "qty": "1", "category": "Higiena i Kosmetyki", "packed": false },
  { "id": 42, "name": "Szczotka do włosów", "qty": "1", "category": "Higiena i Kosmetyki", "packed": false },
  { "id": 43, "name": "Maszynka do golenia jednorazowa", "qty": "1", "category": "Higiena i Kosmetyki", "packed": false },
  { "id": 44, "name": "Kosmetyki do kapieli", "qty": "1 zestaw", "category": "Higiena i Kosmetyki", "packed": false },
  { "id": 45, "name": "Kremy przeciwsłoneczne", "qty": "1", "category": "Higiena i Kosmetyki", "packed": false },
  { "id": 46, "name": "Kremy nawilżające", "qty": "1", "category": "Higiena i Kosmetyki", "packed": false },
  { "id": 47, "name": "Nożyczki do paznokci", "qty": "1", "category": "Higiena i Kosmetyki", "packed": false },
  { "id": 48, "name": "Cążki do paznokci", "qty": "1", "category": "Higiena i Kosmetyki", "packed": false },
  { "id": 49, "name": "Pilnik do paznokci", "qty": "1", "category": "Higiena i Kosmetyki", "packed": false },
  { "id": 50, "name": "Pomadka do ust", "qty": "1", "category": "Higiena i Kosmetyki", "packed": false },
  { "id": 51, "name": "Dezodoranty", "qty": "1", "category": "Higiena i Kosmetyki", "packed": false },
  { "id": 52, "name": "Perfumy", "qty": "1", "category": "Higiena i Kosmetyki", "packed": false },
  { "id": 53, "name": "Okulary przeciwsloneczne", "qty": "Wg potrzeb", "category": "Inne", "packed": false },
  { "id": 54, "name": "Kilka ksiazek", "qty": "2-3", "category": "Inne", "packed": false },
  { "id": 55, "name": "Torba plażowa", "qty": "1", "category": "Inne", "packed": false },
  { "id": 56, "name": "Klapki", "qty": "1 para", "category": "Obuwie", "packed": false },
  { "id": 57, "name": "Sandaly", "qty": "1 para", "category": "Obuwie", "packed": false },
  { "id": 58, "name": "Zabudowane buty", "qty": "1 para", "category": "Obuwie", "packed": false, "notes": "Na powrót" },
  { "id": 59, "name": "Stroje kapielowe", "qty": "2", "category": "Ubrania", "packed": false },
  { "id": 60, "name": "Czapki od slonca", "qty": "Wg potrzeb", "category": "Ubrania", "packed": false },
  { "id": 61, "name": "Ubrania", "qty": "Zestawy", "category": "Ubrania", "packed": false },
  { "id": 62, "name": "Bielizna", "qty": "Zapas", "category": "Ubrania", "packed": false },
  { "id": 63, "name": "Ubrania na powrót", "qty": "1 zestaw", "category": "Ubrania", "packed": false, "notes": "kurtki, dlugie rekawy, skarpety, czapki, szaliki" },
  { "id": 64, "name": "Bidon z wodą", "qty": "1", "category": "W Podróży (Podręczne)", "packed": false },
  { "id": 66, "name": "Laktator", "qty": "1", "category": "Elektronika", "packed": false },
  { "id": 65, "name": "Namiot plażowy", "qty": "1", "category": "Aktywności Specjalne", "packed": false, "optional": true }
];

/**
 * Get item from library by ID
 */
export function getItemById(id: string): ItemDefinition | undefined {
  return ITEM_LIBRARY[id];
}

/**
 * Get items by category
 */
export function getItemsByCategory(category: string): ItemDefinition[] {
  return Object.values(ITEM_LIBRARY).filter(item => item.category === category);
}

/**
 * Search items by query
 */
export function searchItems(query: string): ItemDefinition[] {
  const lowercaseQuery = query.toLowerCase();
  return Object.values(ITEM_LIBRARY).filter(item =>
    item.name.toLowerCase().includes(lowercaseQuery) ||
    item.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    (item.notes && item.notes.toLowerCase().includes(lowercaseQuery))
  );
}

/**
 * Get items by tags
 */
export function getItemsByTags(tags: string[]): ItemDefinition[] {
  const lowercaseTags = tags.map(tag => tag.toLowerCase());
  return Object.values(ITEM_LIBRARY).filter(item =>
    item.tags.some(tag => lowercaseTags.includes(tag.toLowerCase()))
  );
}

/**
 * Get category items by ID list
 */
export function getCategoryItems(itemIds: string[]): ItemDefinition[] {
  return itemIds.map(id => ITEM_LIBRARY[id]).filter(Boolean);
}