import React, { useState } from 'react';
import { Calendar, MapPin, User, Globe, Hash, ArrowRight, Shield, AlertCircle, CheckCircle } from 'lucide-react';

interface TextIdentityInputProps {
  onIdentitySubmitted: (identityData: ManualIdentityData) => void;
}

interface ManualIdentityData {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateProvince: string;
  postalCode: string;
  country: string;
  nationalIdNumber: string;
  passportNumber: string;
  driverLicenseNumber: string;
  phoneNumber: string;
  email: string;
  inputTimestamp?: number;
  userWalletAddress?: string;
}

const TextIdentityInput: React.FC<TextIdentityInputProps> = ({ onIdentitySubmitted }) => {
  const [identityData, setIdentityData] = useState<ManualIdentityData>({
    fullName: '',
    dateOfBirth: '',
    gender: 'PreferNotToSay',
    nationality: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    stateProvince: '',
    postalCode: '',
    country: '',
    nationalIdNumber: '',
    passportNumber: '',
    driverLicenseNumber: '',
    phoneNumber: '',
    email: ''
  });
  
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const validateInput = (): boolean => {
    const errors: string[] = [];
    
    // Full name validation
    if (!identityData.fullName.trim()) {
      errors.push('Full name is required');
    } else if (identityData.fullName.trim().length < 2) {
      errors.push('Full name must be at least 2 characters');
    }
    
    // Date of birth validation
    if (!identityData.dateOfBirth) {
      errors.push('Date of birth is required');
    } else {
      const birthDate = new Date(identityData.dateOfBirth);
      const today = new Date();
      const age = (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      
      if (birthDate > today) {
        errors.push('Birth date cannot be in the future');
      } else if (age < 13) {
        errors.push('Age must be at least 13 years');
      } else if (age > 120) {
        errors.push('Age cannot exceed 120 years');
      }
    }
    
    // Address validation
    if (!identityData.addressLine1.trim()) {
      errors.push('Address line 1 is required');
    }
    
    if (!identityData.city.trim()) {
      errors.push('City is required');
    }
    
    if (!identityData.country.trim()) {
      errors.push('Country is required');
    }
    
    if (!identityData.postalCode.trim()) {
      errors.push('Postal code is required');
    }
    
    // Email validation (if provided)
    if (identityData.email && !validateEmail(identityData.email)) {
      errors.push('Invalid email format');
    }
    
    // Phone validation (if provided)
    if (identityData.phoneNumber && !validatePhone(identityData.phoneNumber)) {
      errors.push('Invalid phone number format (must be 10-15 digits)');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const validatePhone = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10 && digits.length <= 15;
  };

  const handleSubmit = async () => {
    if (!validateInput()) {
      return;
    }
    
    setIsSubmitting(true);
    setShowSuccess(false);
    
    try {
      // Get wallet address if connected
      let walletAddress = 'not-connected';
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            walletAddress = accounts[0];
          }
        } catch (error) {
          console.warn('Could not get wallet address:', error);
        }
      }
      
      const processedData: ManualIdentityData = {
        ...identityData,
        inputTimestamp: Math.floor(Date.now() / 1000),
        userWalletAddress: walletAddress
      };
      
      onIdentitySubmitted(processedData);
      setShowSuccess(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
      
    } catch (error) {
      console.error('Failed to submit identity data:', error);
      setValidationErrors(['Failed to process identity data. Please try again.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof ManualIdentityData, value: string) => {
    setIdentityData(prev => ({ ...prev, [field]: value }));
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Manual Identity Information
          </h2>
        </div>
        <p className="text-gray-600 text-lg">
          Enter your identity information to generate zero-knowledge proofs. 
          <span className="text-purple-600 font-medium"> All data stays on your device</span> and is never transmitted in plaintext.
        </p>
      </div>

      {/* Basic Information Section */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-purple-200">
          <User className="w-5 h-5 text-purple-600" />
          <h3 className="text-xl font-semibold text-gray-800">Basic Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={identityData.fullName}
              onChange={(e) => updateField('fullName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter your full legal name"
            />
          </div>
          
          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={identityData.dateOfBirth}
              onChange={(e) => updateField('dateOfBirth', e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            />
          </div>
          
          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender
            </label>
            <select
              value={identityData.gender}
              onChange={(e) => updateField('gender', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
              <option value="PreferNotToSay">Prefer not to say</option>
            </select>
          </div>
          
          {/* Nationality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nationality
            </label>
            <input
              type="text"
              value={identityData.nationality}
              onChange={(e) => updateField('nationality', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="e.g., Indian, American, British"
            />
          </div>
        </div>
      </div>

      {/* Address Information Section */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-cyan-200">
          <MapPin className="w-5 h-5 text-cyan-600" />
          <h3 className="text-xl font-semibold text-gray-800">Address Information</h3>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Address Line 1 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address Line 1 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={identityData.addressLine1}
              onChange={(e) => updateField('addressLine1', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              placeholder="Street address, apartment, suite, etc."
            />
          </div>
          
          {/* Address Line 2 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address Line 2 (Optional)
            </label>
            <input
              type="text"
              value={identityData.addressLine2}
              onChange={(e) => updateField('addressLine2', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              placeholder="Additional address information"
            />
          </div>
          
          {/* City, State, Postal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={identityData.city}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                placeholder="City"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State/Province
              </label>
              <input
                type="text"
                value={identityData.stateProvince}
                onChange={(e) => updateField('stateProvince', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                placeholder="State/Province"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={identityData.postalCode}
                onChange={(e) => updateField('postalCode', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
                placeholder="Postal Code"
              />
            </div>
          </div>
          
          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={identityData.country}
              onChange={(e) => updateField('country', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              placeholder="e.g., India, United States, United Kingdom"
            />
          </div>
        </div>
      </div>

      {/* Document Numbers Section */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-pink-200">
          <Hash className="w-5 h-5 text-pink-600" />
          <h3 className="text-xl font-semibold text-gray-800">Document Numbers (Optional)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              National ID Number
            </label>
            <input
              type="text"
              value={identityData.nationalIdNumber}
              onChange={(e) => updateField('nationalIdNumber', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              placeholder="e.g., Aadhaar, SSN"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Passport Number
            </label>
            <input
              type="text"
              value={identityData.passportNumber}
              onChange={(e) => updateField('passportNumber', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              placeholder="Passport"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Driver's License
            </label>
            <input
              type="text"
              value={identityData.driverLicenseNumber}
              onChange={(e) => updateField('driverLicenseNumber', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
              placeholder="Driver's License"
            />
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="space-y-6 mb-8">
        <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-200">
          <Globe className="w-5 h-5 text-blue-600" />
          <h3 className="text-xl font-semibold text-gray-800">Contact Information (Optional)</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={identityData.phoneNumber}
              onChange={(e) => updateField('phoneNumber', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="+1 234 567 8900"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={identityData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="you@example.com"
            />
          </div>
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
            <div>
              <h4 className="text-red-800 font-medium mb-2">Please fix the following errors:</h4>
              <ul className="list-disc list-inside text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <p className="text-green-800 font-medium">
              Identity data processed successfully! You can now generate proofs.
            </p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="group bg-gradient-to-r from-purple-600 to-cyan-600 text-white px-8 py-4 rounded-lg hover:from-purple-700 hover:to-cyan-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Processing...
            </>
          ) : (
            <>
              Generate Identity Commitment
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>

      {/* Privacy Notice */}
      <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-cyan-50 border border-purple-200 rounded-lg">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="text-purple-900 font-bold text-lg mb-2">🔒 Privacy Guarantee</h4>
            <p className="text-purple-800 leading-relaxed">
              This information is processed <strong>100% locally on your device</strong>. 
              Only cryptographic commitments and zero-knowledge proofs are generated. Your actual 
              personal data <strong>never leaves your browser</strong> and is <strong>never stored anywhere</strong>.
            </p>
            <p className="text-purple-700 text-sm mt-2">
              ✓ No server uploads &nbsp;&nbsp; ✓ No database storage &nbsp;&nbsp; ✓ Mathematical privacy guarantees
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextIdentityInput;
