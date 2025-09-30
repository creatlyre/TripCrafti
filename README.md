TripCraft - Twój Inteligentny Asystent Podróży
🌟 Wizja Projektu

TripCraft to inteligentny asystent podróży, którego misją jest zrewolucjonizowanie sposobu, w jaki planujemy i przeżywamy wyjazdy. Naszym celem jest zredukowanie stresu związanego z organizacją do minimum, pozwalając podróżnikom czerpać czystą radość z odkrywania świata.

Aplikacja kompleksowo wspiera użytkownika na każdym etapie: od inspiracji i automatycznego planowania, przez precyzyjne zarządzanie budżetem i rezerwacjami, aż po inteligentne spakowanie walizki z pomocą AI.
✨ Główne Funkcjonalności

TripCraft to nie tylko planer, to zintegrowany ekosystem, który dba o każdy detal Twojej podróży.

    ✈️ Centralne Zarządzanie Podróżą (CRUD): Stanowi serce aplikacji. Twórz, przeglądaj, edytuj i usuwaj swoje wyjazdy. Zarządzaj rezerwacjami, kluczowymi dokumentami i notatkami w jednym miejscu.

    💰 Precyzyjne Śledzenie Budżetu: Ustaw ogólny budżet dla podróży i na bieżąco dodawaj wydatki. TripCraft automatycznie podsumuje koszty i pokaże, jak Twoje wydatki mają się do założonego planu.

    🗺️ Inteligentny Kreator Planu Podróży (AI): Opisz swoje zainteresowania, styl podróży i budżet, a Google Gemini stworzy dla Ciebie spersonalizowany, edytowalny plan zwiedzania na każdy dzień.

    🧳 Asystent Pakowania (AI): Na podstawie celu, długości wyjazdu i zaplanowanych aktywności, AI wygeneruje idealną listę rzeczy do spakowania, abyś nigdy więcej o niczym nie zapomniał(a).

    🔒 Bezpieczne Uwierzytelnianie: Pełne bezpieczeństwo i izolacja danych dzięki systemowi rejestracji i logowania. Każda podróż i jej dane należą tylko do Ciebie.

    📱 Pełna Responsywność: Korzystaj z aplikacji wygodnie na komputerze, tablecie i smartfonie.

🛠️ Stos Technologiczny

Aplikacja zbudowana jest w oparciu o nowoczesny i skalowalny stos technologiczny, zapewniający wydajność i bezpieczeństwo.

Kategoria
	

Technologia

Frontend
	

React z TypeScriptem dla interaktywnego i bezpiecznego UI.

Styling
	

Tailwind CSS dla szybkiego budowania nowoczesnych i responsywnych interfejsów.

Backend
	

Node.js z frameworkiem NestJS, zapewniającym modułową i uporządkowaną architekturę.

Baza Danych
	

PostgreSQL – potężna, relacyjna baza danych, idealna do przechowywania złożonych, powiązanych ze sobą danych.

AI
	

Google Gemini API do napędzania inteligentnych funkcji planowania i pakowania.

CI/CD
	

GitHub Actions do automatyzacji procesów testowania, budowania i wdrażania aplikacji.
🏗️ Architektura Aplikacji

TripCraft wykorzystuje architekturę zorientowaną na usługi. Aplikacja kliencka (frontend) komunikuje się z serwerem (backend) poprzez bezpieczne API REST. Backend zarządza całą logiką biznesową, danymi oraz integracją z usługami zewnętrznymi, takimi jak Google Gemini.

[Frontend: React] <--- (API REST) ---> [Backend: NestJS] <--- (Integracja) ---> [Baza Danych: PostgreSQL]
                                              ^
                                              |
                                              v
                                      [Google Gemini API]

🚀 Plan Rozwoju (Roadmap)

Projekt rozwijany jest iteracyjnie. Poniżej znajdują się kluczowe etapy wdrożenia:

    [x] Etap 1: MVP - Rdzeń Planera Podróży

        [x] System uwierzytelniania użytkowników.

        [x] Pełny CRUD dla podróży (Trips).

        [x] Zarządzanie elementami podróży (TripItems) - wydatki, rezerwacje.

        [x] Podstawowe podsumowanie budżetu.

        [x] Konfiguracja infrastruktury (DB, CI/CD).

    [ ] Etap 2: Integracja z Asystentem Pakowania AI

        [ ] Interfejs do generowania listy rzeczy do spakowania.

        [ ] Integracja backendu z Gemini API.

        [ ] Wyświetlanie i zarządzanie wygenerowaną listą (CRUD).

    [ ] Etap 3: Integracja z Inteligentnym Planerem Podróży AI

        [ ] Formularz preferencji użytkownika (zainteresowania, styl podróży).

        [ ] Implementacja zaawansowanych promptów dla Gemini.

        [ ] Wizualizacja planu podróży (np. w formie osi czasu).

        [ ] Możliwość ręcznej edycji planu (np. metodą "przeciągnij i upuść").

    [ ] Etap 4: Udoskonalenia i Funkcje Społecznościowe

        [ ] Udostępnianie planów podróży za pomocą linku.

        [ ] Powiadomienia (np. o nadchodzącym locie).

        [ ] Możliwość dodawania zdjęć i notatek do podróży.

        [ ] Tryb offline.

⚙️ Instalacja i Uruchomienie

Projekt składa się z dwóch głównych części: aplikacji backendowej i frontendowej.
Wymagania

    Node.js (wersja 20.x lub wyższa)

    NPM lub Yarn

    Działająca instancja PostgreSQL

    Klucz API do Google Gemini

Backend (NestJS)

    Sklonuj repozytorium:

    git clone [https://github.com/twoja-nazwa-uzytkownika/tripcraft.git](https://github.com/twoja-nazwa-uzytkownika/tripcraft.git)
    cd tripcraft/backend

    Zainstaluj zależności:

    npm install

    Skonfiguruj zmienne środowiskowe:

        Stwórz plik .env na podstawie .env.example.

        Uzupełnij dane dostępowe do bazy danych (DATABASE_URL) oraz klucz API (GEMINI_API_KEY).

    Uruchom migracje bazy danych (jeśli używasz ORM np. Prisma/TypeORM):

    npm run migrate:dev

    Uruchom serwer deweloperski:

    npm run start:dev

Frontend (React)

    Przejdź do katalogu frontend:

    cd ../frontend

    Zainstaluj zależności:

    npm install

    Skonfiguruj zmienne środowiskowe:

        Stwórz plik .env.local na podstawie .env.example.

        Wskaż adres URL działającego backendu (VITE_API_BASE_URL).

    Uruchom aplikację kliencką:

    npm run dev

🤝 Współtworzenie

Jesteś pasjonatem podróży i kodowania? Chcesz pomóc w rozwoju TripCraft? Twoja pomoc jest mile widziana!

    Sforkuj repozytorium.

    Utwórz nową gałąź (git checkout -b feature/twoja-funkcja).

    Wprowadź swoje zmiany.

    Zacommituj zmiany (git commit -m 'feat: Dodaj nową, wspaniałą funkcję').

    Wypchnij zmiany do swojej gałęzi (git push origin feature/twoja-funkcja).

    Otwórz Pull Request, opisując wprowadzone zmiany.

Stworzone z ❤️ dla wszystkich podróżników.
