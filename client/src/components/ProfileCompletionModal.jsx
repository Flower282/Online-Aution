import { useNavigate } from 'react-router';
import { X, AlertCircle, User, Phone, MapPin, Map } from 'lucide-react';

const ProfileCompletionModal = ({ isOpen, onClose, missingFields = {} }) => {
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleGoToProfile = () => {
        onClose();
        navigate('/profile');
    };

    const getMissingFieldsList = () => {
        const fields = [];
        if (missingFields.phone) fields.push({ icon: Phone, label: 'Số điện thoại' });
        if (missingFields.address) fields.push({ icon: MapPin, label: 'Địa chỉ' });
        if (missingFields.city) fields.push({ icon: Map, label: 'Tỉnh/Thành phố' });
        if (missingFields.ward) fields.push({ icon: Map, label: 'Phường/Xã' });
        return fields;
    };

    const missingFieldsList = getMissingFieldsList();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all scale-100 opacity-100">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 p-2 rounded-full">
                            <AlertCircle className="h-6 w-6 text-emerald-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">
                            Cập nhật thông tin cá nhân
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="mb-6">
                    <p className="text-gray-700 mb-4">
                        Bạn cần cập nhật đầy đủ thông tin cá nhân để có thể đặt cọc và tham gia đấu giá.
                    </p>

                    {missingFieldsList.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                            <p className="text-sm font-medium text-emerald-800 mb-3">
                                Thông tin cần bổ sung:
                            </p>
                            <ul className="space-y-2">
                                {missingFieldsList.map((field, index) => {
                                    const Icon = field.icon;
                                    return (
                                        <li key={index} className="flex items-center gap-2 text-sm text-emerald-700">
                                            <Icon className="h-4 w-4" />
                                            <span>{field.label}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                        Để sau
                    </button>
                    <button
                        onClick={handleGoToProfile}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                        <User className="h-4 w-4" />
                        Cập nhật ngay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileCompletionModal;

