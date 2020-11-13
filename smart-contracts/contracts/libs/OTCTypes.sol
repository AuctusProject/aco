pragma solidity ^0.6.6;
pragma experimental ABIEncoderV2;

library OTCTypes {
    bytes constant internal EIP191_HEADER = "\x19\x01";

    bytes32 constant internal DOMAIN_TYPEHASH = keccak256(abi.encodePacked(
        "EIP712Domain(",
            "string name,",
            "string version,",
            "address verifyingContract",
        ")"
    ));
    
    bytes32 constant internal ASK_ORDER_TYPEHASH = keccak256(abi.encodePacked(
        "Order(",
            "uint256 nonce,",
            "uint256 expiry,",
            "PartyAco signer,",
            "PartyToken sender,",
            "PartyToken affiliate",
        ")",
        "PartyAco(",
            "address responsible,"              
            "uint256 amount,"    
            "address underlying,",
            "address strikeAsset,",
            "bool isCall,",
            "uint256 strikePrice,",
            "uint256 expiryTime",
        ")",
        "PartyToken(",
            "address responsible,"              
            "uint256 amount,"    
            "address token",
        ")"
    ));
    
    bytes32 constant internal BID_ORDER_TYPEHASH = keccak256(abi.encodePacked(
        "Order(",
            "uint256 nonce,",
            "uint256 expiry,",
            "PartyToken signer,",
            "PartyAco sender,",
            "PartyToken affiliate",
        ")",
        "PartyToken(",
            "address responsible,"              
            "uint256 amount,"    
            "address token",
        ")",
        "PartyAco(",
            "address responsible,"              
            "uint256 amount,"    
            "address underlying,",
            "address strikeAsset,",
            "bool isCall,",
            "uint256 strikePrice,",
            "uint256 expiryTime",
        ")"
    ));
    
    bytes32 constant internal PARTY_ACO_TYPEHASH = keccak256(abi.encodePacked(
        "PartyAco(",
            "address responsible,"              
            "uint256 amount,"    
            "address underlying,",
            "address strikeAsset,",
            "bool isCall,",
            "uint256 strikePrice,",
            "uint256 expiryTime",
        ")"
    ));
    
    bytes32 constant internal PARTY_TOKEN_TYPEHASH = keccak256(abi.encodePacked(
        "PartyAco(",
            "address responsible,"              
            "uint256 amount,"    
            "address token",
        ")"
    ));
    
    struct AskOrder {
        uint256 nonce;               
        uint256 expiry;              
        PartyAco signer;                
        PartyToken sender;                 
        PartyToken affiliate;             
        Signature signature;         
    }
    
    struct BidOrder {
        uint256 nonce;               
        uint256 expiry;              
        PartyToken signer;                
        PartyAco sender;                 
        PartyToken affiliate;             
        Signature signature;         
    }
    
    struct PartyAco {                
        address responsible;              
        uint256 amount;     
        address underlying;
        address strikeAsset;
        bool isCall;
        uint256 strikePrice;
        uint256 expiryTime;
    }
    
    struct PartyToken {                
        address responsible;              
        uint256 amount;     
        address token;
    }
    
    struct Signature {
        address signatory;            
        address validator;            
        bytes1 version;               
        uint8 v;                      
        bytes32 r;                    
        bytes32 s;                   
    }

    function hashAskOrder(
        AskOrder memory order,
        bytes32 domainSeparator
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            EIP191_HEADER,
            domainSeparator,
            keccak256(abi.encode(
                ASK_ORDER_TYPEHASH,
                order.nonce,
                order.expiry,
                keccak256(abi.encode(
                    PARTY_ACO_TYPEHASH,
                    order.signer.responsible,
                    order.signer.amount,
                    order.signer.underlying,
                    order.signer.strikeAsset,
                    order.signer.isCall,
                    order.signer.strikePrice,
                    order.signer.expiryTime
                )),
                keccak256(abi.encode(
                    PARTY_TOKEN_TYPEHASH,
                    order.sender.responsible,
                    order.sender.amount,
                    order.sender.token
                )),
                keccak256(abi.encode(
                    PARTY_TOKEN_TYPEHASH,
                    order.affiliate.responsible,
                    order.affiliate.amount,
                    order.affiliate.token
                ))
            ))
        ));
    }

    function hashBidOrder(
        BidOrder memory order,
        bytes32 domainSeparator
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(
            EIP191_HEADER,
            domainSeparator,
            keccak256(abi.encode(
                BID_ORDER_TYPEHASH,
                order.nonce,
                order.expiry,
                keccak256(abi.encode(
                    PARTY_TOKEN_TYPEHASH,
                    order.signer.responsible,
                    order.signer.amount,
                    order.signer.token
                )),
                keccak256(abi.encode(
                    PARTY_ACO_TYPEHASH,
                    order.sender.responsible,
                    order.sender.amount,
                    order.sender.underlying,
                    order.sender.strikeAsset,
                    order.sender.isCall,
                    order.sender.strikePrice,
                    order.sender.expiryTime
                )),
                keccak256(abi.encode(
                    PARTY_TOKEN_TYPEHASH,
                    order.affiliate.responsible,
                    order.affiliate.amount,
                    order.affiliate.token
                ))
            ))
        ));
    }
    
    function hashDomain(
        bytes memory name,
        bytes memory version,
        address verifyingContract
    ) internal pure returns (bytes32) {
    return keccak256(abi.encode(
            DOMAIN_TYPEHASH,
            keccak256(name),
            keccak256(version),
            verifyingContract
        ));
    }
}