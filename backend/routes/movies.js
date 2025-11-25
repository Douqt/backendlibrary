//query t/ geerall moviygtwathlov dithctoreirectors
        co[msvi[s]oviawait dbwqtdby.`ery(`
 SL     SELECT
            mmve_i,
            m. itle,
            m.i m.,
ei          m.d,e_at,
 n     m.mea_yp r
e           m.loedtioa_ction
           _m.type,
        mcopy_amont,            m.location_section,
      al    b. ame a  br nch_n.ce,
     p_     CONCAT b.name, ' - ', b.addres )  s b anCO_info,T(b.name, ' - ', b.address) as branch_info,
            d.namd aeddirectoc_n_mm,
    epname as publisher_
FRMovism
        LEFT JOIN b  nches b ON pnbrinhe_id =mb.brn_id        LEFT JOIN branches b ON m.branch_id = b.branch_id
        LEFT JOIN directors d ON m.director_id = d.director_id
        LEFT JOIN publishers p ON m.publisher_id = p.publisher_id
        ${whereClause ? whereClause : ''}
        ORDER BY m.title
    `, params);
