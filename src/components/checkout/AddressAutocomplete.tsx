'use client';

import React, { useState, useEffect, useRef } from 'react';

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    line1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  }) => void;
  onInputChange: (value: string) => void;
  value: string;
  placeholder?: string;
  className?: string;
  countryRestriction?: string | string[];
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  onAddressSelect,
  onInputChange,
  value,
  placeholder = 'Start typing your address...',
  className = '',
  countryRestriction = ['ca', 'us'],
}) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sessionTokenRef = useRef<any>(null);

  // Initialisation du Token de session (Places New)
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      // @ts-ignore - Nouveau format de token pour Places (New)
      sessionTokenRef.current =
        new window.google.maps.places.AutocompleteSessionToken();
    }
  }, [window.google]);

  // Récupération des suggestions via l'API "Places (New)"
  useEffect(() => {
    if (
      !value ||
      value.length < 3 ||
      !window.google?.maps?.places ||
      !showSuggestions
    ) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      try {
        // @ts-ignore - Utilisation de la nouvelle API recommandée par Google (2025)
        const { suggestions: results } =
          await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
            {
              input: value,
              sessionToken: sessionTokenRef.current,
              includedRegionCodes: Array.isArray(countryRestriction)
                ? countryRestriction
                : [countryRestriction],
            }
          );

        if (results) {
          setSuggestions(results);
        }
      } catch (error) {
        setSuggestions([]);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [value, countryRestriction, showSuggestions]);

  const handleSelect = async (suggestion: any) => {
    const placePrediction = suggestion.placePrediction;
    if (!placePrediction) return;

    onInputChange(placePrediction.text.text);
    setSuggestions([]);
    setShowSuggestions(false);

    try {
      // @ts-ignore - Récupération des détails via la nouvelle classe Place
      const { place } = await window.google.maps.places.Place.fetchFields({
        id: placePrediction.placeId,
        fields: ['addressComponents', 'formattedAddress'],
        sessionToken: sessionTokenRef.current,
      });

      if (place && place.addressComponents) {
        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let zipCode = '';
        let country = '';

        place.addressComponents.forEach((component: any) => {
          const types = component.types;
          if (types.includes('street_number'))
            streetNumber = component.longText;
          if (types.includes('route')) route = component.longText;
          if (types.includes('locality')) {
            city = component.longText;
          } else if (types.includes('sublocality_level_1') && !city) {
            city = component.longText;
          }
          if (types.includes('administrative_area_level_1'))
            state = component.shortText;
          if (types.includes('postal_code')) zipCode = component.longText;
          if (types.includes('country')) country = component.shortText;
        });

        onAddressSelect({
          line1: `${streetNumber} ${route}`.trim(),
          city,
          state,
          postal_code: zipCode,
          country,
        });

        // Renouveler le token pour la prochaine session
        // @ts-ignore
        sessionTokenRef.current =
          new window.google.maps.places.AutocompleteSessionToken();
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={e => {
          onInputChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {suggestions.length > 0 && showSuggestions && (
        <ul className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto">
          {suggestions.map((s, idx) => {
            const prediction = s.placePrediction;
            return (
              <li
                key={prediction.placeId || idx}
                onClick={() => handleSelect(s)}
                className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0 border-gray-100 transition-colors"
              >
                <div className="font-medium text-slate-900">
                  {prediction.text.text}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AddressAutocomplete;
