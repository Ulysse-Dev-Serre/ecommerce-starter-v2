'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SUPPORTED_COUNTRIES } from '@/lib/config/site';

declare global {
  interface Window {
    google: {
      maps: {
        places: {
          AutocompleteSessionToken: new () => google.maps.places.AutocompleteSessionToken;
          AutocompleteSuggestion: {
            fetchAutocompleteSuggestions: (
              config: google.maps.places.AutocompleteOptions
            ) => Promise<{ suggestions: GoogleMapsSuggestion[] }>;
          };
          Place: new (config: { id: string }) => google.maps.places.Place;
        };
      };
    };
  }
}

// Add minimalist types if google.maps is not available in @types
/* eslint-disable @typescript-eslint/no-namespace */
namespace google.maps.places {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-empty-object-type
  export interface AutocompleteSessionToken {}
  export interface AutocompleteOptions {
    input: string;
    sessionToken?: AutocompleteSessionToken | null;
    includedRegionCodes?: string[];
  }
  export interface Place {
    fetchFields: (config: { fields: string[] }) => Promise<void>;
    addressComponents: AddressComponent[];
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

interface GoogleMapsSuggestion {
  placePrediction: {
    placeId: string;
    text: { text: string };
  };
}

interface AddressComponent {
  longText: string;
  shortText: string;
  types: string[];
}

interface AddressAutocompleteProps {
  onAddressSelect: (address: {
    line1: string;
    city: string;
    state: string;
    zip: string;
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
  placeholder = '',
  className = '',
  countryRestriction = SUPPORTED_COUNTRIES.map(c => c.toLowerCase()),
}) => {
  const [suggestions, setSuggestions] = useState<GoogleMapsSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const sessionTokenRef =
    useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  // Initialisation du Token de session (Places New)
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
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

  const handleSelect = async (suggestion: GoogleMapsSuggestion) => {
    const placePrediction = suggestion.placePrediction;
    if (!placePrediction) return;

    // Don't update the input yet - wait for the full address details
    setSuggestions([]);
    setShowSuggestions(false);

    try {
      // Create a new Place instance with the placeId
      const place = new window.google.maps.places.Place({
        id: placePrediction.placeId,
      });

      // Fetch the address components
      await place.fetchFields({
        fields: ['addressComponents', 'formattedAddress'],
      });

      if (place && place.addressComponents) {
        let streetNumber = '';
        let route = '';
        let city = '';
        let state = '';
        let zipCode = '';
        let country = '';

        place.addressComponents.forEach((component: AddressComponent) => {
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

        const streetAddress = `${streetNumber} ${route}`.trim();

        // Update the input field with ONLY the street address
        onInputChange(streetAddress);

        // Then populate all other fields
        onAddressSelect({
          line1: streetAddress,
          city,
          state,
          zip: zipCode,
          country,
        });

        // Renouveler le token pour la prochaine session
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
        data-testid="address-autocomplete-input"
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
        <ul className="absolute z-[9999] w-full mt-1 bg-background border border-border rounded-lg shadow-xl max-h-60 overflow-auto">
          {suggestions.map((s, idx) => {
            const prediction = s.placePrediction;
            return (
              <li
                key={prediction.placeId || idx}
                onClick={() => handleSelect(s)}
                className="px-4 py-3 hover:bg-muted cursor-pointer border-b last:border-b-0 border-border transition-colors"
              >
                <div className="font-medium text-foreground">
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
