// blst-dcc.swg — DCC fork SWIG wrapper for supranational/blst
//
// The primary byte*/size_t overloads in blst.hpp have trailing default args
// (aug=nullptr, aug_len=0). SWIG's default-argument expansion generates two
// Java overloads with identical signatures: one that passes (aug ptr+len) as a
// proper pair and one that passes aug ptr alone (aug_len defaults to 0). Both
// collapse to (byte[], String, byte[]) in Java, causing javac duplicate errors.
//
// %feature("compactdefaultargs") suppresses this expansion: SWIG emits a single
// wrapper per method and uses C++ default values directly. One clean Java API.
//
// The C++17 string_view convenience overloads are ignored entirely (they are
// inline wrappers over the byte*/size_t primary forms — no functionality lost).

// Suppress default-argument expansion for methods with (byte* aug, size_t aug_len)
// that generate duplicate Java signatures:
%feature("compactdefaultargs") blst::Scalar::hash_to;
%feature("compactdefaultargs") blst::Scalar::Scalar;
%feature("compactdefaultargs") blst::Scalar::keygen;
%feature("compactdefaultargs") blst::Scalar::keygen_v3;
%feature("compactdefaultargs") blst::Scalar::keygen_v4_5;
%feature("compactdefaultargs") blst::Scalar::keygen_v5;
%feature("compactdefaultargs") blst::P1::hash_to;
%feature("compactdefaultargs") blst::P1::encode_to;
%feature("compactdefaultargs") blst::P1_Affine::core_verify;
%feature("compactdefaultargs") blst::P2::hash_to;
%feature("compactdefaultargs") blst::P2::encode_to;
%feature("compactdefaultargs") blst::P2_Affine::core_verify;
%feature("compactdefaultargs") blst::Pairing::aggregate;
%feature("compactdefaultargs") blst::Pairing::mul_n_aggregate;

// Suppress the C++17 string_view convenience overloads entirely.
// These are inline wrappers over the byte*/size_t forms — zero functionality lost.
%ignore blst::Scalar::Scalar(const app__string_view, const std::string&);
%ignore blst::Scalar::hash_to(const app__string_view, const std::string&);
%ignore blst::P1::hash_to(const app__string_view, const std::string&, const app__string_view);
%ignore blst::P1::encode_to(const app__string_view, const std::string&, const app__string_view);
%ignore blst::P1_Affine::core_verify(const blst::P2_Affine&, bool, const app__string_view, const std::string&, const app__string_view) const;
%ignore blst::P2::hash_to(const app__string_view, const std::string&, const app__string_view);
%ignore blst::P2::encode_to(const app__string_view, const std::string&, const app__string_view);
%ignore blst::P2_Affine::core_verify(const blst::P1_Affine&, bool, const app__string_view, const std::string&, const app__string_view) const;
%ignore blst::Pairing::Pairing(bool, const app__string_view);
%ignore blst::Pairing::aggregate(const blst::P1_Affine*, const blst::P2_Affine*, const app__string_view, const app__string_view);
%ignore blst::Pairing::aggregate(const blst::P2_Affine*, const blst::P1_Affine*, const app__string_view, const app__string_view);
%ignore blst::Pairing::mul_n_aggregate(const blst::P1_Affine*, const blst::P2_Affine*, const byte*, size_t, const app__string_view, const app__string_view);
%ignore blst::Pairing::mul_n_aggregate(const blst::P2_Affine*, const blst::P1_Affine*, const byte*, size_t, const app__string_view, const app__string_view);

%include "bindings/blst.swg"
